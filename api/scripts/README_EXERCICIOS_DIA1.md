# 📚 Criação de Exercícios - Dia 1: Primeiro Contato

## Resumo

Este guia descreve como criar os 3 exercícios do Dia 1 como **templates reutilizáveis** para a turma de Informática.

### Exercícios Inclusos

1. **Dia 1: Navegação no Portal** - Múltipla escolha (4 questões)
2. **Dia 1: Conhecendo o Mouse** - Prático (descrever experiência)
3. **Dia 1: Clique Consciente** - Prático (feedback sobre cliques)

---

## Opção 1: Via SQL (Banco de Dados Direto)

### Pré-requisitos
- Acesso ao banco de dados PostgreSQL
- Cliente psql ou DBeaver

### Passos

1. **Execute o script SQL:**
```bash
psql -U seu_usuario -d sua_database -f criar_exercicios_dia1.sql
```

2. **Ou no DBeaver:**
   - Abra `criar_exercicios_dia1.sql`
   - Execute o script inteiro

3. **Verifique se foi criado:**
```sql
SELECT id, titulo, modulo FROM exercicios WHERE modulo = 'Dia 1 - Primeiro Contato';
```

Deve retornar 3 exercícios.

---

## Opção 2: Via Portal (Admin UI)

### Pré-requisitos
- Estar logado como Admin
- Acesso à página `/dashboard/exercicios`

### Passos

1. **Acesse Exercícios** → Dashboard → "Exercícios" no menu lateral

2. **Crie o Exercício 1:**
   - **Título:** `Dia 1: Navegação no Portal`
   - **Descrição:** [Copie da seção abaixo]
   - **Módulo:** `Dia 1 - Primeiro Contato`
   - **Tema:** `Navegação no Portal`
   - **Prazo:** Deixe em branco (opcional)
   - **Publicar agora:** ✅ Marcado
   - **Clique:** Salvar

3. **Repita para os exercícios 2 e 3** com os dados abaixo

---

## Descrições Completas dos Exercícios

### Exercício 1: Navegação no Portal

**Título:** `Dia 1: Navegação no Portal`

**Descrição:**
```markdown
## 🎯 Objetivo
Aprender a navegar no portal do aluno e encontrar elementos-chave.

## 📋 Tarefas

### Questão 1: Onde fica o menu principal?
A) No topo da página
B) Na barra lateral esquerda
C) No rodapé
D) Não existe menu

**Resposta correta: B**

### Questão 2: Onde você acessa as aulas?
A) Na aba "Trilha do Curso"
B) Na aba "Materiais"
C) Na aba "Videoaulas Bônus"
D) Em "Dashboard"

**Resposta correta: A**

### Questão 3: Como você submete um exercício?
A) Pelo menu de configurações
B) Clicando no botão de envio na página do exercício
C) Por email
D) Não é possível submeter

**Resposta correta: B**

### Questão 4: Qual aba mostra seu perfil e informações pessoais?
A) Dashboard
B) Exercícios
C) Perfil
D) Turmas

**Resposta correta: C**

## ✅ Conclusão
Marque cada questão que acertou. Se acertar 3 ou 4, você domina a navegação!
```

**Módulo:** `Dia 1 - Primeiro Contato`
**Tema:** `Navegação no Portal`

---

### Exercício 2: Conhecendo o Mouse

**Título:** `Dia 1: Conhecendo o Mouse`

**Descrição:**
```markdown
## 🎯 Objetivo
Aprender a usar o mouse corretamente e entender seus componentes.

## 🖱️ Componentes do Mouse

### Botão Esquerdo
- Usado para clicar em botões e links
- Seleção de texto

### Botão Direito
- Abre menu de contexto
- Não assuste, é seguro explorar!

### Rodinha (Scroll)
- Rola a página para cima e para baixo
- Use com moderação

## 📋 Tarefas Práticas

1. **Clique em 5 botões diferentes no portal** (Dashboard, Exercícios, Turmas, Materiais, Perfil)
2. **Rolar uma página até o final** - role toda a página de exercícios até o final
3. **Voltar ao topo** - use a rodinha para voltar
4. **Clique direito em um elemento** - veja o menu aparecer (não é assustador!)

## 💡 Dica
Você estará pronto quando conseguir fazer tudo isso SEM abrir janelas extras ou se perder.

## ✅ Envie uma evidência
Quando completar, descreva qual foi seu maior desafio ao usar o mouse.
```

**Módulo:** `Dia 1 - Primeiro Contato`
**Tema:** `Controle do Mouse`

---

### Exercício 3: Clique Consciente

**Título:** `Dia 1: Clique Consciente`

**Descrição:**
```markdown
## 🎯 Objetivo
Entender os diferentes tipos de cliques e perder o medo de explorar.

## 🖱️ Tipos de Cliques

### Clique Simples (Um dedo, uma vez)
- Ativa botões
- Seleciona opções
- Abre links

### Clique Duplo (Um dedo, duas vezes rápidas)
- Abre arquivos
- Abre pastas
- Ativa edição em alguns elementos

### Clique Direito (Botão direito do mouse)
- Abre menu de opções
- Oferece alternativas
- Totalmente seguro!

## 📋 Tarefas Práticas

1. **Clique simples em um botão** - escolha qualquer botão do portal e clique UMA VEZ
2. **Clique duplo em um item** - encontre um exercício ou turma e clique DUAS VEZES rápidas
3. **Clique direito em um elemento** - clique com o botão direito em qualquer lugar e observe o menu

## 🎓 Objetivo Oculto
Você está aprendendo que **não dá para quebrar nada!** O computador foi feito para resistir.

## ✅ Envie seu feedback
Descreva:
- Qual tipo de clique foi mais fácil?
- Qual tipo foi mais desafiador?
- Perdeu o medo? 😊
```

**Módulo:** `Dia 1 - Primeiro Contato`
**Tema:** `Controle do Mouse e Cliques`

---

## Próximos Passos

Após criar os exercícios:

1. **Atribuir à turma:**
   - Vá para `/dashboard/turmas`
   - Selecione a turma de Informática
   - Adicione os 3 exercícios

2. **Publicar com data agendada:**
   - Use `published_at` para agendar publicação
   - Exemplo: Segunda-feira 09:00 para a Semana 1

3. **Testar:**
   - Faça login como aluno
   - Veja se os exercícios aparecem
   - Envie uma resposta de teste

---

## Estrutura de Dados

```json
{
  "titulo": "string (obrigatório)",
  "descricao": "string (obrigatório)",
  "modulo": "string (obrigatório)",
  "tema": "string (opcional)",
  "prazo": "datetime (opcional)",
  "publicado": "boolean (default: true)",
  "published_at": "datetime (opcional, para agendamento)"
}
```

---

## Notas Importantes

✅ Exercícios criados como **templates** - podem ser reutilizados em qualquer turma
✅ Tipo `texto` - aceita respostas em texto livre
✅ Sem pontuação - avaliação por checklist
✅ Sem prazo específico - use ao atribuir à turma
✅ Publicados imediatamente - altere conforme necessário

---

## Suporte

Para dúvidas ou problemas:
- Verifique se os exercícios foram inseridos: `SELECT COUNT(*) FROM exercicios WHERE modulo = 'Dia 1 - Primeiro Contato';`
- Verifique a atribuição à turma: `SELECT * FROM exercicio_turma WHERE turma_id = 'seu_turma_id';`
