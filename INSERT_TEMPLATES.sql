-- =====================================================
-- TEMPLATES DE MÚLTIPLA ESCOLHA - PROGRAMAÇÃO
-- =====================================================

-- Template 1: JavaScript - var, let, const
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Qual é a diferença entre var, let e const?',
  'Escolha a alternativa correta sobre as diferenças entre var, let e const em JavaScript.',
  'JavaScript Avançado',
  'Escopo e Hoisting',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'programacao',
  NULL,
  '{"questoes": [{"texto": "Qual é a diferença entre var, let e const?", "alternativas": [{"id": "a", "texto": "var é function-scoped, let é block-scoped, const é block-scoped e imutável"}, {"id": "b", "texto": "Todos têm o mesmo escopo"}, {"id": "c", "texto": "const pode ser reatribuído"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 2: JavaScript - this keyword
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'O que é "this" em JavaScript?',
  'Qual é o comportamento da palavra-chave "this" em JavaScript?',
  'JavaScript Avançado',
  'Contexto e Binding',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'programacao',
  NULL,
  '{"questoes": [{"texto": "O que é this em JavaScript?", "alternativas": [{"id": "a", "texto": "Uma variável que referencia o objeto que chama o método"}, {"id": "b", "texto": "Uma constante que sempre aponta para window"}, {"id": "c", "texto": "Uma palavra reservada que não pode ser usada"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 3: JavaScript - Promises
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'O que é uma Promise em JavaScript?',
  'Qual das alternativas melhor descreve uma Promise?',
  'JavaScript Avançado',
  'Assincronismo',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'programacao',
  NULL,
  '{"questoes": [{"texto": "O que é uma Promise?", "alternativas": [{"id": "a", "texto": "Um objeto que representa a eventual conclusão (ou falha) de uma operação assíncrona"}, {"id": "b", "texto": "Uma função que sempre retorna um valor imediatamente"}, {"id": "c", "texto": "Um tipo de variável que não pode ser modificada"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 4: JavaScript - Array Methods
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Qual método percorre um array sem modificá-lo?',
  'Identifique o método que itera sobre um array sem alterar seus elementos.',
  'JavaScript Intermediário',
  'Array Methods',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'programacao',
  NULL,
  '{"questoes": [{"texto": "Qual método de array NÃO modifica o array original?", "alternativas": [{"id": "a", "texto": "map()"}, {"id": "b", "texto": "push()"}, {"id": "c", "texto": "pop()"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- =====================================================
-- TEMPLATES DE MÚLTIPLA ESCOLHA - INFORMÁTICA
-- =====================================================

-- Template 1: Redes - IP
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'O que é um endereço IP?',
  'Qual é a função de um endereço IP em uma rede?',
  'Redes de Computadores',
  'Conceitos Básicos',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'informatica',
  NULL,
  '{"questoes": [{"texto": "O que é um endereço IP?", "alternativas": [{"id": "a", "texto": "Um identificador único que permite que computadores se comuniquem em uma rede"}, {"id": "b", "texto": "Uma senha para acessar a internet"}, {"id": "c", "texto": "Um tipo de arquivo de dados"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 2: Redes - DNS
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Qual é a função do DNS?',
  'O que o DNS faz em uma rede?',
  'Redes de Computadores',
  'Protocolos',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'informatica',
  NULL,
  '{"questoes": [{"texto": "Qual é a função do DNS?", "alternativas": [{"id": "a", "texto": "Traduzir nomes de domínio em endereços IP"}, {"id": "b", "texto": "Enviar emails pela internet"}, {"id": "c", "texto": "Proteger arquivos contra vírus"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 3: HTTP vs HTTPS
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Qual é a diferença entre HTTP e HTTPS?',
  'Identifique a principal diferença entre os protocolos HTTP e HTTPS.',
  'Redes de Computadores',
  'Segurança Web',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'informatica',
  NULL,
  '{"questoes": [{"texto": "Qual é a diferença entre HTTP e HTTPS?", "alternativas": [{"id": "a", "texto": "HTTPS usa criptografia para proteger os dados, HTTP não"}, {"id": "b", "texto": "HTTP é mais rápido que HTTPS"}, {"id": "c", "texto": "Não há diferença entre eles"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 4: Sistemas Operacionais
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'Qual é a função de um Sistema Operacional?',
  'Qual alternativa melhor descreve a função do SO?',
  'Sistemas Operacionais',
  'Conceitos Básicos',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'informatica',
  NULL,
  '{"questoes": [{"texto": "Qual é a principal função de um Sistema Operacional?", "alternativas": [{"id": "a", "texto": "Gerenciar recursos do computador e fornecer interface para o usuário"}, {"id": "b", "texto": "Executar apenas programas de internet"}, {"id": "c", "texto": "Armazenar arquivos sem permitir acesso"}], "correta": "a"}]}',
  NOW(),
  NOW()
);

-- Template 5: Banco de Dados
INSERT INTO exercicios (
  id, titulo, descricao, modulo, tema, prazo, publicado, published_at,
  created_by, tipo_exercicio, gabarito, linguagem_esperada, is_template, categoria,
  mouse_regras, multipla_regras, created_at, updated_at
) VALUES (
  gen_random_uuid(),
  'O que é uma chave primária em banco de dados?',
  'Qual é a função de uma chave primária?',
  'Banco de Dados',
  'Conceitos Básicos',
  NULL,
  true,
  NULL,
  NULL,
  'texto',
  NULL,
  NULL,
  true,
  'informatica',
  NULL,
  '{"questoes": [{"texto": "O que é uma chave primária?", "alternativas": [{"id": "a", "texto": "Um identificador único que distingue cada registro em uma tabela"}, {"id": "b", "texto": "Uma senha para acessar o banco"}, {"id": "c", "texto": "Um tipo de backup de dados"}], "correta": "a"}]}',
  NOW(),
  NOW()
);
