# Imagens de profissionais e serviços — Design

## Objetivo

Permitir que profissionais e serviços tenham uma imagem opcional cadastrada no painel administrativo, exibida como miniatura nas listas de `/painel/profissionais` e `/painel/servicos`, e substituível ou removível nos respectivos formulários.

## Decisões

- A imagem será armazenada no PostgreSQL como texto Base64 em uma coluna `TEXT`; não haverá dependência de AWS, S3, Cloudinary ou outro serviço externo.
- O contrato usará o campo `imagem`, que é neutro o suficiente para representar a foto de um profissional e a imagem de um serviço.
- O valor será uma Data URL completa, por exemplo `data:image/jpeg;base64,...`, ou `null` quando não houver imagem.
- Serão aceitos somente `image/jpeg`, `image/png` e `image/webp`.
- O limite de seleção no frontend será de 2 MiB por arquivo. O backend também limitará o tamanho do Data URL recebido a 2.800.000 caracteres, rejeitando entradas maiores ou com MIME não permitido.
- SVG será rejeitado para evitar conteúdo ativo embutido em imagens.
- O formulário de criação também terá o campo, para que a imagem não precise ser adicionada somente depois; a tela de edição permitirá substituir e remover a imagem existente.

## Arquitetura e fluxo

### Backend

1. Criar uma migração Flyway adicionando `imagem TEXT NULL` às tabelas `profissionais` e `servicos`.
2. Adicionar o campo nullable aos modelos `Profissional` e `Servico`, com validação compartilhada para Data URL, MIME permitido e tamanho máximo.
3. Expandir `ProfissionalRequest`, `ProfissionalResponse`, `ServicoRequest` e `ServicoResponse` com `imagem`.
4. Preservar o comportamento atual quando o campo não for enviado: criação e atualização sem imagem continuam válidas e linhas antigas retornam `imagem: null`.
5. Em atualizações, `imagem: null` significa remover a imagem; uma nova Data URL substitui a anterior.
6. Os endpoints existentes `POST` e `PUT` continuam sendo usados, sem novos endpoints de upload ou arquivos estáticos.

### Frontend

1. Criar um componente compartilhado `ImageUploadField` para seleção, validação local, pré-visualização, substituição e remoção.
2. Integrar o componente aos `ProfessionalForm` e `ServiceForm` por meio dos schemas, tipos e inputs de API existentes.
3. Exibir a imagem no `ProfessionalList` como avatar circular com `object-fit: cover`; sem imagem, manter as iniciais e a cor temática atuais.
4. Exibir a imagem no `ServiceList` no lugar do glifo atual; sem imagem, manter o glifo colorido existente.
5. Usar `accept="image/jpeg,image/png,image/webp"`, informar o limite de 2 MiB e preservar a imagem atual quando uma nova seleção for inválida.
6. Manter os erros de API no mecanismo de erro existente dos formulários e exibir erros de arquivo junto ao campo.

## Contratos de dados

Profissional:

```ts
interface ProfissionalResponse {
  id: string
  nome: string
  especialidade: string
  imagem: string | null
  horariosTrabalho: HorarioTrabalhoResponse[]
}

interface ProfissionalInput {
  nome: string
  especialidade: string
  imagem: string | null
  horariosTrabalho: HorarioTrabalhoResponse[]
}
```

Serviço:

```ts
interface ServicoResponse {
  id: string
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
  imagem: string | null
}

interface ServicoInput {
  nome: string
  duracaoMinutos: number
  preco: PrecoResponse
  imagem: string | null
}
```

O campo deve ser enviado em `POST` e `PUT`, inclusive como `null` quando o usuário remover a imagem. A ausência do campo em clientes antigos será tratada como `null` no backend.

## Validação e erros

- O frontend rejeita seleção que não seja JPEG, PNG ou WebP, ou que ultrapasse 2 MiB, sem alterar o valor atual.
- O backend rejeita Data URLs malformadas, MIME não permitido e valores acima do limite de caracteres com `400 Bad Request`, usando a mensagem de validação já exibida pelos formulários.
- A remoção não exige confirmação adicional: clicar em “Remover imagem” limpa a pré-visualização e envia `imagem: null` ao salvar.
- A imagem não será renderizada como HTML; será usada exclusivamente no atributo `src` de `img` depois da validação do contrato.

## Layout e acessibilidade

- O upload terá `label` associado a um `input type="file"` e texto visível explicando os formatos e o limite.
- A pré-visualização do profissional terá `alt=""`, pois o nome do profissional já aparece ao lado; o card continuará identificável pelo título.
- A pré-visualização do serviço terá `alt=""` pelo mesmo motivo.
- Botões de substituir e remover terão nomes acessíveis e foco visível.
- O layout atual dos cards será preservado; a imagem ocupará apenas a área do avatar/glifo, sem mudar o conteúdo textual nem as ações.

## Testes e critérios de aceite

Backend:

- A migração cria as duas colunas nullable.
- Criar e atualizar profissional/serviço persiste uma imagem válida.
- Atualizar com `imagem: null` remove a imagem.
- Registros antigos e requests sem imagem retornam `imagem: null`.
- MIME não permitido e Data URL acima do limite são rejeitados.

Frontend:

- O componente de upload mostra a pré-visualização após uma seleção válida.
- Seleção inválida mostra erro e preserva o valor anterior.
- Remover limpa a pré-visualização e emite `null`.
- Os formulários enviam o campo no cadastro e na edição.
- As listas exibem a imagem quando disponível e os fallbacks atuais quando não disponível.
- A suíte existente e o build do frontend continuam passando.

## Fora de escopo

- Redimensionamento, compressão ou recorte de imagens.
- Múltiplas imagens por cadastro.
- Galeria de mídia.
- Armazenamento externo ou endpoint independente de upload.
- Migração automática das iniciais/glifos para imagens geradas.
