# Imagens de profissionais e serviços Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Permitir cadastrar, substituir, remover e visualizar imagens opcionais de profissionais e serviços usando Data URLs Base64 armazenadas no PostgreSQL.

**Architecture:** O backend persistirá um campo `imagem` nullable em cada entidade e validará Data URLs raster antes de salvar. O frontend terá um componente compartilhado de upload que converte arquivos locais para Data URLs, alimenta os formulários existentes e fornece os fallbacks atuais nos cards quando não houver imagem.

**Tech Stack:** Java 21, Spring Boot, JPA, Flyway, PostgreSQL, JUnit 5, React 19, TypeScript, React Hook Form, Zod, Vitest e Testing Library.

**Spec:** `docs/superpowers/specs/2026-10-07-catalog-image-fields-design.md`

## Global Constraints

- A imagem será armazenada no PostgreSQL como texto Base64 em uma coluna `TEXT`; não haverá dependência de AWS, S3, Cloudinary ou outro serviço externo.
- Serão aceitos somente `image/jpeg`, `image/png` e `image/webp`.
- O limite de seleção no frontend será de 2 MiB por arquivo.
- O backend limitará o tamanho do Data URL recebido a 2.800.000 caracteres.
- `imagem: null` significa remover a imagem.
- SVG, redimensionamento, compressão, recorte, múltiplas imagens e endpoints independentes de upload estão fora de escopo.
- Não alterar nem incluir no commit as mudanças preexistentes fora da feature.

---

### Task 1: Validar Data URLs e criar a migração de armazenamento

**Files:**
- Backend Create: `src/main/java/com/agendaplus/shared/domain/model/ImagemData.java`
- Backend Test: `src/test/java/com/agendaplus/shared/domain/model/ImagemDataTest.java`
- Backend Create: `src/main/resources/db/migration/V6__add_imagem_catalogo.sql`

**Interfaces:**
- Produces `ImagemData.validar(String imagem)` as a null-tolerant static validator used by both catalog entities.
- `ImagemData` accepts `null`, otherwise requires a Data URL matching `data:image/(jpeg|png|webp);base64,<payload>` and length at most `2_800_000` characters.
- The migration adds `imagem TEXT` to `profissionais` and `servicos` without changing existing rows.

- [ ] **Step 1: Write the failing validation tests**

Add tests for a valid JPEG Data URL, `null`, SVG rejection, unsupported MIME rejection, malformed Data URL rejection, and the exact maximum-length boundary.

```java
@Test
void aceitaDataUrlRasterValida() {
    assertThatCode(() -> ImagemData.validar("data:image/jpeg;base64,YQ==")).doesNotThrowAnyException();
}

@Test
void rejeitaSvg() {
    assertThatIllegalArgumentException()
        .isThrownBy(() -> ImagemData.validar("data:image/svg+xml;base64,YQ=="));
}
```

- [ ] **Step 2: Run the focused test and verify RED**

Run from `agenda-plus-backend/.worktrees/catalog-images`:

```powershell
mvn -q -Dtest=ImagemDataTest test
```

Expected: compilation/test failure because `ImagemData` does not exist yet.

- [ ] **Step 3: Implement the validator and migration**

Implement the validator with a single compiled pattern, a public constant for `MAX_DATA_URL_LENGTH`, and `IllegalArgumentException` messages that identify invalid format, MIME or size. Create `V6__add_imagem_catalogo.sql` with:

```sql
ALTER TABLE profissionais ADD COLUMN imagem TEXT;
ALTER TABLE servicos ADD COLUMN imagem TEXT;
```

- [ ] **Step 4: Run the focused test and verify GREEN**

```powershell
mvn -q -Dtest=ImagemDataTest test
```

Expected: all `ImagemDataTest` tests pass.

- [ ] **Step 5: Commit the backend foundation**

```powershell
git add src/main/java/com/agendaplus/shared/domain/model/ImagemData.java src/test/java/com/agendaplus/shared/domain/model/ImagemDataTest.java src/main/resources/db/migration/V6__add_imagem_catalogo.sql
git commit -m "feat: adiciona armazenamento de imagens do catalogo"
```

### Task 2: Expor e persistir imagem nos contratos de profissionais e serviços

**Files:**
- Backend Modify: `src/main/java/com/agendaplus/professionals/domain/model/Profissional.java`
- Backend Modify: `src/main/java/com/agendaplus/professionals/application/dto/ProfissionalRequest.java`
- Backend Modify: `src/main/java/com/agendaplus/professionals/application/dto/ProfissionalResponse.java`
- Backend Modify: `src/main/java/com/agendaplus/professionals/application/ProfissionalService.java`
- Backend Modify: `src/main/java/com/agendaplus/services/domain/model/Servico.java`
- Backend Modify: `src/main/java/com/agendaplus/services/application/dto/ServicoRequest.java`
- Backend Modify: `src/main/java/com/agendaplus/services/application/dto/ServicoResponse.java`
- Backend Modify: `src/main/java/com/agendaplus/services/application/ServicoService.java`
- Backend Test: `src/test/java/com/agendaplus/ProfessionalsIntegrationTest.java`
- Backend Test: `src/test/java/com/agendaplus/ServicesIntegrationTest.java`

**Interfaces:**
- `ProfissionalRequest` becomes `(nome, especialidade, imagem, horariosTrabalho)` and `ServicoRequest` becomes `(nome, duracaoMinutos, preco, imagem)`; `imagem` is nullable.
- Both response records expose `String imagem` and map the entity value unchanged.
- `Profissional.atualizarDados` and `Servico.atualizar` accept image data and call `ImagemData.validar(imagem)`.
- Create and update service methods pass `request.imagem()` through; null clears the persisted column.

- [ ] **Step 1: Add failing integration assertions**

Extend the existing authenticated create/update flows with a small valid JPEG Data URL, assert it in the response and fetch response, then update the same resource with `imagem: null` and assert null. Add invalid MIME/oversize request cases expecting HTTP 400. Existing request bodies without `imagem` must remain valid.

```java
private static final String IMAGEM = "data:image/jpeg;base64,YQ==";

assertThat(criacao.getResponse().getContentAsString()).contains(IMAGEM);
```

- [ ] **Step 2: Run the focused integration tests and verify RED**

```powershell
mvn -q -Dtest=ProfessionalsIntegrationTest,ServicesIntegrationTest test
```

Expected: compilation failures for the new record arguments/accessors or assertion failures because the API does not yet expose `imagem`.

- [ ] **Step 3: Implement entity, DTO and service support**

Add a nullable `@Column(columnDefinition = "TEXT") private String imagem` to each entity, include it in constructors and update methods, add `getImagem()`, expand records and map the new field. Preserve old clients by allowing Jackson to deserialize a missing `imagem` as null. Invoke `ImagemData.validar` before mutating state.

- [ ] **Step 4: Run the focused integration tests and verify GREEN**

```powershell
mvn -q -Dtest=ProfessionalsIntegrationTest,ServicesIntegrationTest test
```

Expected: all focused tests pass, including Flyway migration, persistence, replacement, removal and validation cases.

- [ ] **Step 5: Commit the backend API**

```powershell
git add src/main/java/com/agendaplus/professionals src/main/java/com/agendaplus/services src/test/java/com/agendaplus/ProfessionalsIntegrationTest.java src/test/java/com/agendaplus/ServicesIntegrationTest.java
git commit -m "feat: permite imagens nos profissionais e servicos"
```

### Task 3: Criar o componente compartilhado de upload

**Files:**
- Frontend Create: `src/components/ui/ImageUploadField.tsx`
- Frontend Create: `src/components/ui/ImageUploadField.test.tsx`

**Interfaces:**
- `ImageUploadFieldProps` accepts `id`, `label`, `value: string | null`, `onChange: (value: string | null) => void`, and optional `error`.
- The component exports `MAX_IMAGE_BYTES = 2 * 1024 * 1024` and `ACCEPTED_IMAGE_TYPES = ['image/jpeg', 'image/png', 'image/webp'] as const`.
- A valid file is converted with `FileReader.readAsDataURL`; invalid files leave `value` unchanged and expose an accessible error.

- [ ] **Step 1: Write failing component tests**

Test valid selection renders an image and calls `onChange` with a Data URL, invalid MIME and oversized files show an error without changing the value, and the remove button calls `onChange(null)`.

```tsx
it('converts a valid image file into a preview Data URL', async () => {
  const onChange = vi.fn()
  render(<ImageUploadField id="professional-image" label="Imagem" value={null} onChange={onChange} />)
  fireEvent.change(screen.getByLabelText('Imagem'), { target: { files: [new File(['a'], 'foto.jpg', { type: 'image/jpeg' })] } })
  await waitFor(() => expect(onChange).toHaveBeenCalledWith('data:image/jpeg;base64,YQ=='))
})
```

- [ ] **Step 2: Run the focused test and verify RED**

```powershell
npm run test:run -- src/components/ui/ImageUploadField.test.tsx
```

Expected: module/render failure because the component does not exist.

- [ ] **Step 3: Implement the minimal upload field**

Render a labeled file input, the current preview when `value` is non-null, an explicit “Remover imagem” button, accepted formats/size helper text, and a `role="alert"` validation message. Reset the input value after each selection so the same file can be selected again.

- [ ] **Step 4: Run the focused test and verify GREEN**

```powershell
npm run test:run -- src/components/ui/ImageUploadField.test.tsx
```

Expected: all upload field tests pass.

- [ ] **Step 5: Commit the shared frontend component**

```powershell
git add src/components/ui/ImageUploadField.tsx src/components/ui/ImageUploadField.test.tsx
git commit -m "feat: adiciona campo compartilhado de imagem"
```

### Task 4: Integrar imagem aos tipos, schemas e formulários

**Files:**
- Frontend Modify: `src/types/professionals.ts`
- Frontend Modify: `src/types/services.ts`
- Frontend Modify: `src/features/professionals/schemas/professionalSchema.ts`
- Frontend Modify: `src/features/services/schemas/serviceSchema.ts`
- Frontend Modify: `src/features/professionals/components/ProfessionalForm.tsx`
- Frontend Modify: `src/features/services/components/ServiceForm.tsx`
- Frontend Create: `src/features/professionals/components/ProfessionalForm.test.tsx`
- Frontend Create: `src/features/services/components/ServiceForm.test.tsx`

**Interfaces:**
- Both `ProfissionalInput` and `ServicoInput` carry `imagem: string | null`.
- Both form schemas carry `imagem: z.string().nullable()` and default it to null.
- Editing maps `response.imagem ?? null` into the form; submit sends the selected Data URL or null through the existing mutation hooks.

- [ ] **Step 1: Write failing form tests**

Mock the existing create/update hooks, render each form, select a valid file through `ImageUploadField`, submit, and assert the mutation receives `imagem` alongside the existing fields. Add a removal case for an edited record with an existing image.

```tsx
expect(updateProfessional).toHaveBeenCalledWith(expect.objectContaining({ input: expect.objectContaining({ imagem: null }) }))
```

- [ ] **Step 2: Run the focused tests and verify RED**

```powershell
npm run test:run -- src/features/professionals/components/ProfessionalForm.test.tsx src/features/services/components/ServiceForm.test.tsx
```

Expected: files fail to compile or cannot find the image field because the schemas/forms do not expose it yet.

- [ ] **Step 3: Integrate the field into both forms**

Add `imagem: null` to empty/default values and reset values, use `Controller` to connect `ImageUploadField`, and keep existing API error and submit behavior unchanged. Add the image to both TypeScript input/response types and Zod schemas.

- [ ] **Step 4: Run the focused tests and verify GREEN**

```powershell
npm run test:run -- src/features/professionals/components/ProfessionalForm.test.tsx src/features/services/components/ServiceForm.test.tsx
```

Expected: create, edit, replacement and removal form tests pass.

- [ ] **Step 5: Commit frontend data flow**

```powershell
git add src/types/professionals.ts src/types/services.ts src/features/professionals/schemas src/features/services/schemas src/features/professionals/components/ProfessionalForm.tsx src/features/services/components/ServiceForm.tsx src/features/professionals/components/ProfessionalForm.test.tsx src/features/services/components/ServiceForm.test.tsx
git commit -m "feat: conecta imagens aos formularios do catalogo"
```

### Task 5: Render thumbnails and preserve fallbacks

**Files:**
- Frontend Modify: `src/features/professionals/components/ProfessionalList.tsx`
- Frontend Modify: `src/features/services/components/ServiceList.tsx`
- Frontend Modify: `src/styles/pages.css`
- Frontend Create: `src/features/professionals/components/ProfessionalList.test.tsx`
- Frontend Create: `src/features/services/components/ServiceList.test.tsx`

**Interfaces:**
- A professional with `imagem` renders one `img` inside the card avatar area; without it, initials remain.
- A service with `imagem` renders one `img` inside the existing glyph area; without it, the `✦` glyph remains.
- Image elements use empty alt text and `object-fit: cover`; the existing card title remains the accessible identifier.

- [ ] **Step 1: Write failing list tests**

Render each list with one image-backed item and one null-image item. Assert image `src`, fallback initials/glyph, edit/delete callbacks and existing labels.

- [ ] **Step 2: Run the focused tests and verify RED**

```powershell
npm run test:run -- src/features/professionals/components/ProfessionalList.test.tsx src/features/services/components/ServiceList.test.tsx
```

Expected: image assertions fail because both lists currently render only initials or the glyph.

- [ ] **Step 3: Implement image/fallback rendering and styles**

Conditionally render `img` when `imagem` is truthy, otherwise render the current fallback. Add focused classes such as `.professional-card__photo`, `.service-row__photo`, and responsive sizing rules without changing card actions or text layout.

- [ ] **Step 4: Run focused and style tests**

```powershell
npm run test:run -- src/features/professionals/components/ProfessionalList.test.tsx src/features/services/components/ServiceList.test.tsx src/styles/page-styles.test.ts src/styles/content-pages.test.ts
```

Expected: all focused list and style tests pass.

- [ ] **Step 5: Commit thumbnails and styles**

```powershell
git add src/features/professionals/components/ProfessionalList.tsx src/features/services/components/ServiceList.tsx src/features/professionals/components/ProfessionalList.test.tsx src/features/services/components/ServiceList.test.tsx src/styles/pages.css
git commit -m "feat: exibe miniaturas no catalogo"
```

### Task 6: Full verification and handoff for integration

**Files:**
- Modify: no source files; inspect both repositories and generated artifacts only.

- [ ] **Step 1: Run all frontend tests**

```powershell
npm run test:run
```

Expected: zero failures.

- [ ] **Step 2: Run frontend build and lint**

```powershell
npm run build
npm run lint
```

Expected: build exits 0; lint exits 0 or reports only pre-existing findings that are documented in the handoff.

- [ ] **Step 3: Run all backend tests**

```powershell
mvn -q test
```

Expected: zero failures with Testcontainers available. Use the direct Maven command if `mvnw.cmd` repeats its existing PowerShell wrapper error.

- [ ] **Step 4: Inspect diff and repository status**

```powershell
git diff --check
git status --short
git log --oneline -6
```

Expected: only feature commits and intended files are present in each feature worktree; no generated files or unrelated changes are staged.

- [ ] **Step 5: Stop before merging or pushing**

Present the verification evidence and wait for the user's approval. After approval, merge/cherry-pick the frontend and backend feature branches into their respective `master` branches, run the full verification again on `master`, and push both remotes only then.
