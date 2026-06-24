### Pacote 1 – Estudo de Caso
#### Área de Requisitos de Software

---

#### 1. Identificação do Projeto - 
*   **Nome do Projeto:** Projeto Integrador - Flamboyant Shopping
*   **Equipe / Grupo:** Grupo 8 - João Vitor, Hiago, João Pedro Muniz, João Pedro luz, Juan
*   **Data:** 15/04/2026
*   **Stakeholders principais:** Jéssica Pedrosa <jessicalmeida.adm@gmail.com>

*   Escopo: **RELACIONAMENTO, ENGENHARIA, ARQUITETURA E BRIGADA**

---






#### 2. Necessidades
##### 2.1 Descrição das Necessidades
*   **Gestão de notificações:** A equipe de gestão de relacionamentos enfrenta dificuldade em acompanhar notificações relacionadas aos lojistas, devido à ausência de um registro estruturado e centralizado, necessitando de melhor visibilidade e controle dessas ocorrências .
*   **Organização das vistorias:** As áreas responsáveis têm dificuldade em organizar e acompanhar vistorias realizadas nas lojas, devido à falta de categorização e estrutura dos registros, impactando o controle operacional .
*   **Controle de ocorrências e multas:** A gestão não consegue monitorar adequadamente ocorrências que podem gerar penalidades, devido à ausência de histórico consolidado e rastreável das ações realizadas com os lojistas.
*   **Centralização de registros operacionais:** As informações operacionais dos lojistas estão distribuídas em diferentes fontes, dificultando o acesso, análise e tomada de decisão .
*   **Integração entre áreas:** As áreas de Arquitetura, Engenharia e Brigada não possuem um ambiente integrado de colaboração, dificultando a comunicação e o acompanhamento de atividades conjuntas .
*   **Monitoramento do status operacional:** A equipe não consegue visualizar o status das operações relacionadas aos lojistas, prejudicando o acompanhamento e priorização das atividades .
*   **Gestão de documentos e evidências:** Não existe um repositório centralizado para armazenar documentos e evidências das operações, dificultando auditoria, rastreabilidade e validação das ações .

##### 2.2 Problemas Identificados
*   Dificuldade na obtenção de informações consolidadas sobre ocorrências e interações com lojistas, impactando a tomada de decisão .
*   Fragmentação dos dados operacionais entre diferentes áreas e ferramentas .
*   Falta de integração entre os departamentos de Arquitetura, Engenharia e Brigada .
*   Ausência de controle estruturado do status das operações .
*   Falta de rastreabilidade de documentos e evidências associadas às ocorrências .
*   Baixa visibilidade sobre histórico de notificações, vistorias e multas .

##### 2.3 Objetivos do Sistema
*   Centralizar as informações operacionais e institucionais dos lojistas em um único sistema.
*   Permitir o registro, consulta e rastreamento de notificações, vistorias, multas e interações .
*   Disponibilizar visualização do status das operações em tempo real .
*   Promover integração e colaboração entre as áreas envolvidas .
*   Garantir armazenamento estruturado de documentos e evidências .
*   Apoiar a tomada de decisão por meio de acesso rápido e confiável às informações .

---

#### 3. Fontes de Requisitos

| Tipo de Fonte | Descrição | Método de Coleta |
| ------ | ------ | ------ |
| Stakeholders | Jessica Pedrosa - gerente de relacionamentos . | Entrevista e brainstorm com o cliente para levantamento de necessidades operacionais . |
| Documentos | Proposta do projeto e materiais institucionais . | Análise documental para entendimento do contexto e diretrizes do negócio . |
| Sistemas existentes | - Sistema CRMALL;<br>- Ferramentas internas utilizadas pelas áreas . | Entrevista e brainstorm com o cliente para identificação de funcionalidades relevantes . |
| Observação | Não houve observação do ambiente operacional do shopping . | Não aplicável - recomenda-se observação in loco dos processos operacionais . |

---

#### 4. Escopo do Produto
##### 4.1 Dentro do Escopo
O escopo do sistema contempla as seguintes funcionalidades, organizadas por domínio:

**a) Gestão de Notificações:**

* Registro, consulta e acompanhamento de notificações relacionadas aos lojistas;

* Classificação das notificações por tipo (comunicados, alertas, sinistros, entre outros);
* Associação das notificações ao respectivo lojista;
* Possibilidade de anexar documentos e evidências às notificações.

 **b) Gestão de Vistorias:** 
* Registro e acompanhamento de vistorias realizadas nas lojas;
* Armazenamento de informações como tipo, data, responsável e resultado;
* Histórico completo de vistorias por lojista;
* Associação de evidências (imagens e documentos).


   **c) Gestão de Multas e Ocorrências:** 
* Registro e controle de multas aplicadas aos lojistas;
* Manutenção do histórico de multas e seus respectivos status;
* Registro de ocorrências associadas ao lojista, com classificação e acompanhamento;
* Integração entre ocorrências, vistorias e possíveis penalidades.



  **d) Gestão de Interações Institucionais:**
* Registro das interações entre os lojistas e a administração do shopping;
* Registro de solicitações de contato ou comunicação iniciadas pelos lojistas (realizadas por meio de canais externos);
* Armazenamento do histórico de interações para fins de rastreabilidade.


  **e) Gestão de Documentos e Evidências:** 
* Armazenamento centralizado de documentos e evidências relacionados aos registros do sistema;
* Associação de arquivos a notificações, vistorias, multas e registros operacionais;
* Garantia de rastreabilidade e integridade das evidências armazenadas.

  **f) Gestão do Histórico do Lojista:** 
* Organização de todas as informações de forma individualizada por lojista;
* Visualização consolidada do histórico operacional e institucional;
* Consulta de dados com filtros por tipo de registro e período.


   **g) Controle e Auditoria:** 
* Registro automático de logs de todas as ações realizadas no sistema;
* Identificação do usuário responsável por cada operação;
* Garantia de rastreabilidade e transparência das informações. 


##### 4.2 Fora do Escopo
O sistema não contemplará:
*   Acesso direto por lojistas .
*   Envio ativo na troca de comunicações (e-mails, mensagens ou notificações externas).
*   Automação de decisões administrativas (como aplicação automática de multas) .
*   Alteração irrestrita de registros históricos .
*   Funcionalidades de atendimento ao cliente (SAC), no caso dos lojistas .

##### 4.3 Descrição Geral do Produto
O sistema será uma plataforma de apoio à gestão operacional do shopping, voltada para o registro, organização e rastreabilidade das interações e ocorrências relacionadas aos lojistas . Seu foco principal será fornecer suporte às áreas de Arquitetura, Engenharia e Brigada, permitindo o acompanhamento estruturado das atividades realizadas, com ênfase no histórico institucional e operacional dos lojistas . A solução prioriza a centralização das informações, a integridade dos dados e a transparência das operações, contribuindo para a melhoria da tomada de decisão e da gestão interna do shopping .

---

#### 5. Histórias de Usuário
##### Funcionalidade #01: Registro de notificações 
**COMO:** colaborador da área de Relacionamento, Arquitetura, Engenharia ou Brigada .   
**QUERO:** registrar notificações associadas a um lojista, informando o tipo e anexando evidências .   **PARA:** garantir rastreabilidade da comunicação institucional e consulta no histórico do lojista .
###### Critérios de Aceitação
**Cenário 1: Registro válido**
*   **DADO:** que o usuário está autenticado.
*   **QUANDO:** informar lojista, tipo de notificação e salvar .
*   **ENTÃO:** o sistema deve registrar a notificação associada ao lojista .

**Cenário 2: Consulta de histórico**
*   **DADO:** que o usuário está registrando uma notificação.
*   **QUANDO:** anexar um arquivo .
*   **ENTÃO:** o sistema deve armazenar o arquivo vinculado à notificação .

---

##### Funcionalidade #02: Registro de vistorias 
**COMO:** colaborador técnico (Arquitetura, Engenharia ou Brigada) .  
 **QUERO:** registrar vistorias realizadas, informando tipo, data e resultado .   
 **PARA:** permitir acompanhamento da conformidade operacional das lojas .
###### Critérios de Aceitação
**Cenário 1: Registro de vistoria**
*   **DADO:** que o usuário está autenticado .
*   **QUANDO:** informar lojista, tipo de vistoria e resultado.
*   **ENTÃO:** o sistema deve registrar a vistoria no histórico do lojista.

**Cenário 2: Consulta de histórico**
*   **DADO:** que existem vistorias registradas .
*   **QUANDO:** acessar o histórico do lojista .
*   **ENTÃO:** o sistema deve exibir todas as vistorias associadas.

---

##### Funcionalidade #03: Registro de multas 
**COMO:** gestor operacional .  
 **QUERO:** registrar multas associadas a um lojista .   
 **PARA:** manter histórico de penalidades e apoiar análise operacional.
###### Critérios de Aceitação
**Cenário 1: Registro de multa**
*   **DADO:** que o usuário está autenticado.
*   **QUANDO:** informar lojista e registrar a multa.
*   **ENTÃO:** o sistema deve armazenar a multa vinculada ao lojista .

**Cenário 2: Consulta consolidada**
*   **DADO:** que existem multas registradas .
*   **QUANDO:** acessar o histórico do lojista .
*   **ENTÃO:** o sistema deve exibir as multas associadas .

---

#### 6. Requisitos Funcionais

| ID | Descrição |
| ------ | ------ |
| RF-01 | O sistema deve permitir cadastrar, editar, consultar e excluir notificações vinculadas a um lojista, contendo: tipo de notificação e anexos . |
| RF-02 | O sistema deve permitir cadastrar, editar, consultar e excluir vistorias, contendo: tipo de vistoria, resultado e anexos . |
| RF-03 | O sistema deve permitir cadastrar, editar, consultar e excluir multas associadas a um lojista . |
| RF-04 | O sistema deve permitir atualizar o status de uma multa para: paga, contestada ou não paga . |
| RF-05 | O sistema deve registrar logs de todas as ações realizadas pelos usuários, contendo usuário, data, hora, tipo de operação, entidade afetada e os valores antes e depois da alteração, quando aplicável . |
| RF-06 | O sistema deve permitir cadastrar, editar, consultar e excluir registros operacionais vinculados ao lojista, contendo observações, intervenções e dados técnicos das áreas de arquitetura, engenharia e brigada . |
| RF-07 | O sistema deve permitir visualizar o status de conformidade operacional do lojista com base em vistorias e multas . |
| RF-08 | O sistema deve permitir anexar arquivos a notificações, vistorias, multas e registros operacionais no momento do cadastro ou posteriormente . |
| RF-09 | O sistema deve permitir o cadastro, armazenamento e consulta de documentos institucionais relacionados às áreas de arquitetura, engenharia e brigada . |
| RF-10 | O sistema deve permitir consultar notificações, vistorias, multas e registros operacionais por lojista, com possibilidade de filtragem por tipo e período . |
| RF-11 | O sistema deve permitir registrar interações entre as áreas de arquitetura, engenharia e brigada relacionadas a um lojista, contendo área responsável, tipo de interação, data e descrição . |
| RF-12 | O sistema deve permitir consultar o histórico de interações entre áreas por lojista . |

---

#### 7. Requisitos Não Funcionais

| ID | Categoria | Descrição |
| ------ | ------ | ------ |
| RNF-01 | Desempenho | O sistema deve responder às requisições de consulta em até 2 segundos para 95% das operações . |
| RNF-02 | Desempenho | O sistema deve suportar no mínimo 200 usuários simultâneos sem degradação significativa de performance . |
| RNF-03 | Disponibilidade | O sistema deve estar disponível 99% do tempo mensal, exceto em janelas programadas de manutenção . |
| RNF-04 | Segurança | O sistema deve exigir autenticação de usuário para acesso às funcionalidades . |
| RNF-05 | Segurança | O sistema deve controlar acesso por perfis de usuário (ex: administrador, colaborador) . |
| RNF-06 | Segurança | O sistema deve registrar logs de acesso e operações realizadas pelos usuários . |
| RNF-07 | Auditoria | O sistema deve garantir rastreabilidade de todas as alterações realizadas nos registros . |
| RNF-08 | Usabilidade | O sistema deve permitir que usuários realizem o registro de uma notificação em até 3 minutos sem treinamento prévio . |
| RNF-09 | Usabilidade | O sistema deve apresentar interface compatível com dispositivos móveis (responsivo) . |
| RNF-10 | Compatibilidade | O sistema deve ser acessível via navegadores web modernos (Chrome, Edge, Firefox) . |
| RNF-11 | Interoperabilidade | O sistema deve permitir integração com sistemas externos por meio de APIs REST . |
| RNF-12 | Confiabilidade | O sistema deve garantir que dados salvos não sejam perdidos em caso de falha, mantendo persistência em banco de dados . |

---

#### 8. Regras de Negócio

| ID | Regra |
| ------ | ------ |
| RN-01 | **Registro de Sinistros:** Todo sinistro que impacte um ou mais lojistas deve ser obrigatoriamente registrado no sistema contendo, no mínimo: tipo do sinistro, data de ocorrência, lojistas afetados, área do shopping impactada e status do sinistro. Não será permitido o registro sem esses campos . |
| RN-02 | **Classificação de Ocorrências:** Toda ocorrência relacionada a um lojista deve possuir obrigatoriamente classificação de gravidade (baixa, média ou alta) e status (aberta ou encerrada). Não será permitido alterar status para “encerrada” sem registro de conclusão . |
| RN-03 | **Gestão de Apólices:** O histórico de apólices deve estar vinculado ao cadastro do lojista, contendo: período de vigência, seguradora, tipo de cobertura e valor segurado. Apólices vencidas devem permanecer apenas para consulta . |
| RN-04 | **Encerramento de Contrato:** Ao encerrar contrato, o cadastro do lojista deve ser marcado como inativo. Informações históricas permanecem para consulta, vedada edição ou exclusão . |
| RN-05 | **Registro de Vistorias:** Toda vistoria deve ser registrada com, no mínimo: data, responsável, lojista, itens verificados e resultado. O campo “resultado” é obrigatório e restrito a: aprovado, aprovado com ressalvas ou reprovado . |

---

#### 9. Fluxos de Estados  (Faremos depois)
##### 9.1 Descrição do Fluxo
##### 9.2 Estados Identificados
##### 9.3 Transições

---

#### 10. Rastreabilidade

| Necessidade | História de Usuário | RF | RNF | RN |
| ------ | ------ | ------ | ------ | ------ |
| Garantir registro e rastreabilidade da comunicação com lojistas | HU01 – Registro de notificações  | RF-01, RF-05, RF-08, RF-10  | RNF-01, RNF-06, RNF-08  | RN-01, RN-04, RN-06  |
| Permitir acompanhamento da conformidade operacional das lojas  | HU02 – Registro de vistorias  | RF-02, RF-06, RF-07, RF-09  | RNF-01, RNF-12  | RN-02, RN-05  |
| Manter controle de penalidades e gestão operacional dos lojistas  | HU03 – Registro de multas  | RF-03, RF-04, RF-11, RF-12  | RNF-01, RNF-07  | RN-03, RN-07, RN-08  |

---

#### 11. Observações Gerais
*   O sistema não contempla acesso direto por lojistas, sendo restrito a usuários internos do shopping, conforme definição de escopo .
*   As funcionalidades descritas dependem da identificação única do lojista, definida pelo Grupo 1, sendo obrigatória a integração entre os grupos .
*   Os registros (notificações, vistorias, multas) devem ser vinculados ao histórico consolidado do lojista, garantindo rastreabilidade ao longo do tempo .
*   A definição detalhada de tipos (ex: tipos de notificação, vistoria e multa) não foi especificada e deve ser validada com stakeholders .
*   Não foram definidos critérios de classificação de ocorrências ou regras de aplicação de multas, sendo necessária elicitação adicional .
*   Recomenda-se validação com as áreas de Arquitetura, Engenharia e Brigada para garantir aderência ao fluxo real de trabalho .
