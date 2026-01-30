-- Script para criar os 3 exercícios do Dia 1 como templates reutilizáveis
-- Execute este script no banco de dados para inserir os exercícios

-- Exercício 1: Navegação no Portal
INSERT INTO exercicios (
  id,
  titulo,
  descricao,
  modulo,
  tema,
  publicado,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Dia 1: Navegação no Portal',
  '## 🎯 Objetivo
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
Marque cada questão que acertou. Se acertar 3 ou 4, você domina a navegação!',
  'Dia 1 - Primeiro Contato',
  'Navegação no Portal',
  true,
  NOW(),
  NOW()
);

-- Exercício 2: Conhecendo o Mouse
INSERT INTO exercicios (
  id,
  titulo,
  descricao,
  modulo,
  tema,
  publicado,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Dia 1: Conhecendo o Mouse',
  '## 🎯 Objetivo
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
Quando completar, descreva qual foi seu maior desafio ao usar o mouse.',
  'Dia 1 - Primeiro Contato',
  'Controle do Mouse',
  true,
  NOW(),
  NOW()
);

-- Exercício 3: Clique Consciente
INSERT INTO exercicios (
  id,
  titulo,
  descricao,
  modulo,
  tema,
  publicado,
  created_at,
  updated_at
) VALUES (
  gen_random_uuid(),
  'Dia 1: Clique Consciente',
  '## 🎯 Objetivo
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
- Perdeu o medo? 😊',
  'Dia 1 - Primeiro Contato',
  'Controle do Mouse e Cliques',
  true,
  NOW(),
  NOW()
);
