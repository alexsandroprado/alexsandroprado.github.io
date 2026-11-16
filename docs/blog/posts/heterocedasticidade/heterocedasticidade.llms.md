A heterocedasticidade e a autocorrelação são problemas comuns na análise de regressão, especialmente em séries temporais e dados econométricos, que podem afetar a validade das inferências e a análise de causalidade.

Heterocedasticidade refere-se à condição em que a variância dos erros (ou resíduos) de um modelo de regressão não é constante ao longo das observações. Em outras palavras, os erros variam em intensidade dependendo do nível da variável independente. Esse problema pode levar a estimativas ineficientes dos coeficientes da regressão, fazendo com que os testes estatísticos, como o teste t e o teste F, se tornem não confiáveis. Isso significa que as inferências sobre a significância das variáveis podem ser incorretas, resultando em um erro na identificação das relações causais.

Autocorrelação, por outro lado, ocorre quando os erros do modelo de regressão não são independentes uns dos outros, mas sim correlacionados ao longo do tempo ou das observações. Esse problema é particularmente prevalente em dados de séries temporais. A presença de autocorrelação indica que há padrões não capturados pelo modelo, o que pode levar a subestimação ou superestimação da variabilidade dos coeficientes de regressão. Assim como a heterocedasticidade, a autocorrelação torna os testes estatísticos tradicionais inapropriados, resultando em inferências enganosas e dificultando a análise de causalidade correta.

Ambos os problemas prejudicam a capacidade de um modelo de fornecer estimativas confiáveis e podem levar à formulação de políticas ou decisões baseadas em conclusões erradas. Para mitigar esses problemas, podem ser utilizadas técnicas como a transformação dos dados, o uso de modelos robustos a heterocedasticidade e autocorrelação, ou a aplicação de modelos que explicitamente modelam a estrutura dos erros, como modelos GARCH para heterocedasticidade e modelos ARIMA para autocorrelação.

# Passo 1: Identificar a Heterocedasticidade

Primeiro, vamos carregar alguns pacotes necessários e criar um conjunto de dados fictício:

# Passo 2: Ajustar o Modelo de Regressão Linear

Vamos ajustar um modelo de regressão linear simples:

    Call:
    lm(formula = salary ~ experience + education, data = data)

    Residuals:
         Min       1Q   Median       3Q      Max 
    -1069.88  -309.87   -33.51   254.44  1702.00 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept)  4749.48     465.62   10.20   <2e-16 ***
    experience    995.12      28.89   34.45   <2e-16 ***
    education     320.02      27.27   11.74   <2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 524.1 on 97 degrees of freedom
    Multiple R-squared:  0.9299,    Adjusted R-squared:  0.9285 
    F-statistic: 643.8 on 2 and 97 DF,  p-value: < 2.2e-16

# Passo 3: Diagnosticar Heterocedasticidade

Podemos usar o teste de Breusch-Pagan para diagnosticar a presença de heterocedasticidade

        studentized Breusch-Pagan test

    data:  model
    BP = 17.285, df = 2, p-value = 0.0001764

Se o p-valor do teste for menor que 0.05, isso indica a presença de heterocedasticidade.

# Passo 4: Tratar Heterocedasticidade

Uma maneira comum de tratar a heterocedasticidade é usar estimadores robustos de erro padrão. Vamos ajustar o modelo novamente com erros robustos:

    t test of coefficients:

                Estimate Std. Error t value  Pr(>|t|)    
    (Intercept) 4749.481    459.819  10.329 < 2.2e-16 ***
    experience   995.117     37.144  26.791 < 2.2e-16 ***
    education    320.022     26.539  12.059 < 2.2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

# Outras técnicas

Além do uso de estimadores robustos, existem várias outras medidas para tratar a heterocedasticidade em um modelo de regressão linear. A escolha da técnica pode depender da natureza dos dados e da estrutura da heterocedasticidade. Aqui estão algumas abordagens adicionais:

## 1. Transformações de Variáveis

Transformar a variável dependente ou independente pode ajudar a estabilizar a variância dos erros. Transformações comuns incluem:

Logarítmica: Aplicar o logaritmo na variável dependente pode ser eficaz quando a variância dos erros aumenta com o valor da variável dependente.

    Call:
    lm(formula = log(salary) ~ experience + education, data = data)

    Residuals:
          Min        1Q    Median        3Q       Max 
    -0.071087 -0.021134 -0.000469  0.018983  0.091538 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept) 8.906897   0.029442  302.52   <2e-16 ***
    experience  0.067282   0.001827   36.84   <2e-16 ***
    education   0.022101   0.001724   12.82   <2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 0.03314 on 97 degrees of freedom
    Multiple R-squared:  0.9384,    Adjusted R-squared:  0.9371 
    F-statistic:   739 on 2 and 97 DF,  p-value: < 2.2e-16

Raiz Quadrada: Usar a raiz quadrada da variável dependente pode ser útil em alguns casos.

    Call:
    lm(formula = sqrt(salary) ~ experience + education, data = data)

    Residuals:
        Min      1Q  Median      3Q     Max 
    -4.2463 -1.2381 -0.2119  1.1691  5.9950 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept)  79.9427     1.8098   44.17   <2e-16 ***
    experience    4.0817     0.1123   36.35   <2e-16 ***
    education     1.3270     0.1060   12.52   <2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 2.037 on 97 degrees of freedom
    Multiple R-squared:  0.9368,    Adjusted R-squared:  0.9354 
    F-statistic: 718.3 on 2 and 97 DF,  p-value: < 2.2e-16

## 2. Modelos de Regressão Ponderada (WLS)

Se a heterocedasticidade é sistemática, ponderar as observações pelo inverso da variância estimada dos erros pode melhorar a eficiência dos estimadores:

    Call:
    lm(formula = salary ~ experience + education, data = data, weights = weights)

    Weighted Residuals:
        Min      1Q  Median      3Q     Max 
    -2.6267 -0.8224 -0.1781  0.7972  3.0487 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept)  5057.32     348.80   14.50   <2e-16 ***
    experience    993.10      18.41   53.94   <2e-16 ***
    education     301.39      22.46   13.42   <2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 1.295 on 97 degrees of freedom
    Multiple R-squared:   0.97, Adjusted R-squared:  0.9694 
    F-statistic:  1569 on 2 and 97 DF,  p-value: < 2.2e-16

## 3. Modelos Generalizados (GLM)

Usar um modelo de regressão mais flexível, como os modelos lineares generalizados (GLM), pode ser apropriado. Por exemplo, a família de distribuições Gamma pode ser adequada para dados positivos com variância crescente:

    Call:
    glm(formula = salary ~ experience + education, family = Gamma(link = "log"), 
        data = data)

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept) 8.907700   0.029539  301.56   <2e-16 ***
    experience  0.067364   0.001833   36.76   <2e-16 ***
    education   0.022057   0.001730   12.75   <2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    (Dispersion parameter for Gamma family taken to be 0.001105443)

        Null deviance: 1.71347  on 99  degrees of freedom
    Residual deviance: 0.10675  on 97  degrees of freedom
    AIC: 1528.4

    Number of Fisher Scoring iterations: 3

## 4. Substituir Variáveis com Novas Variáveis

Às vezes, a heterocedasticidade pode ser causada pela omissão de variáveis relevantes. Incluir novas variáveis que capturem a fonte da heterocedasticidade pode ajudar a corrigir o problema.

### Passo 1: Preparação dos Dados

Primeiro, vamos criar um conjunto de dados fictício que contém algumas variáveis correlacionadas e uma variável dependente.

### Passo 2: Ajustar o Modelo de Regressão Inicial

Vamos ajustar um modelo de regressão linear inicial com as variáveis originais.

    Call:
    lm(formula = salary ~ experience + education + age, data = data)

    Residuals:
         Min       1Q   Median       3Q      Max 
    -2491.38  -653.92    56.64   670.33  2532.10 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept)  4979.10    1050.34   4.740 7.39e-06 ***
    experience    972.27      58.44  16.638  < 2e-16 ***
    education     323.11      54.73   5.904 5.35e-08 ***
    age           144.26      11.22  12.854  < 2e-16 ***
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 1052 on 96 degrees of freedom
    Multiple R-squared:  0.8153,    Adjusted R-squared:  0.8095 
    F-statistic: 141.3 on 3 and 96 DF,  p-value: < 2.2e-16

        studentized Breusch-Pagan test

    data:  model_initial
    BP = 1.9213, df = 3, p-value = 0.5889

### Passo 3: Criar Novas Variáveis

Suponhamos que a relação entre salary e as variáveis experience, education e age pode ser melhor capturada por variáveis transformadas ou interações entre elas. Vamos criar algumas novas variáveis:

### Passo 4: Ajustar o Modelo de Regressão com Novas Variáveis

Ajustamos o modelo de regressão linear novamente, agora incluindo as novas variáveis.

    Call:
    lm(formula = salary ~ experience + education + age + experience_sq + 
        education_sq + age_sq + exp_edu_interaction + exp_age_interaction + 
        edu_age_interaction, data = data)

    Residuals:
         Min       1Q   Median       3Q      Max 
    -2447.43  -575.88     6.46   637.16  2491.77 

    Coefficients:
                          Estimate Std. Error t value Pr(>|t|)  
    (Intercept)         13725.6033  8177.1699   1.679   0.0967 .
    experience           1188.9324   638.5934   1.862   0.0659 .
    education            -532.1790   807.9010  -0.659   0.5118  
    age                    19.3482   134.7004   0.144   0.8861  
    experience_sq         -10.1395    24.4353  -0.415   0.6792  
    education_sq           14.9166    21.6304   0.690   0.4922  
    age_sq                  0.1987     1.0295   0.193   0.8474  
    exp_edu_interaction     5.2872    37.1765   0.142   0.8872  
    exp_age_interaction    -4.6483     6.1003  -0.762   0.4481  
    edu_age_interaction     8.4608     6.0194   1.406   0.1633  
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 1063 on 90 degrees of freedom
    Multiple R-squared:  0.823, Adjusted R-squared:  0.8053 
    F-statistic: 46.49 on 9 and 90 DF,  p-value: < 2.2e-16

        studentized Breusch-Pagan test

    data:  model_new
    BP = 8.5597, df = 9, p-value = 0.4789

## 5. Análise de Componentes Principais (PCA)

Se as variáveis independentes são altamente correlacionadas, o uso de PCA para reduzir a dimensionalidade pode ajudar a mitigar a heterocedasticidade.

### Passo 1: Preparação dos Dados

Vamos criar um conjunto de dados fictício com variáveis correlacionadas:

### Passo 2: Análise de Componentes Principais (PCA)

Vamos aplicar a PCA às variáveis independentes:

    Importance of components:
                              PC1    PC2    PC3
    Standard deviation     1.0726 0.9900 0.9324
    Proportion of Variance 0.3835 0.3267 0.2898
    Cumulative Proportion  0.3835 0.7102 1.0000

### Passo 3: Seleção de Componentes Principais

Vamos escolher quantos componentes principais (PCs) utilizar com base na proporção da variância explicada:

        salary        PC1        PC2
    1 22273.57 -1.6807281  1.4217451
    2 22120.70 -1.1845614  0.1235709
    3 22609.83  1.3975878 -0.2722631
    4 21006.18 -0.2159818  0.3810757
    5 19636.21  0.7027710  0.6176000
    6 23767.93  1.5835543 -0.5682535

### Passo 4: Ajuste do Modelo de Regressão Linear Usando Componentes Principais

    Call:
    lm(formula = salary ~ PC1 + PC2, data = data_pca)

    Residuals:
        Min      1Q  Median      3Q     Max 
    -5497.9 -1321.4  -106.2  1311.4  6532.0 

    Coefficients:
                Estimate Std. Error t value Pr(>|t|)    
    (Intercept) 21069.94     222.54  94.677   <2e-16 ***
    PC1            96.68     208.52   0.464   0.6439    
    PC2          -394.22     225.92  -1.745   0.0842 .  
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

    Residual standard error: 2225 on 97 degrees of freedom
    Multiple R-squared:  0.03251,   Adjusted R-squared:  0.01256 
    F-statistic:  1.63 on 2 and 97 DF,  p-value: 0.2013

        studentized Breusch-Pagan test

    data:  model_pca
    BP = 0.050589, df = 2, p-value = 0.975

    t test of coefficients:

                 Estimate Std. Error t value Pr(>|t|)    
    (Intercept) 21069.939    222.545 94.6773  < 2e-16 ***
    PC1            96.679    180.262  0.5363  0.59296    
    PC2          -394.219    203.820 -1.9342  0.05601 .  
    ---
    Signif. codes:  0 '***' 0.001 '**' 0.01 '*' 0.05 '.' 0.1 ' ' 1

**Explicação do Código:**

Preparação dos Dados: Criamos um conjunto de dados fictício com variáveis correlacionadas (experience, education, age) e uma variável dependente (salary).

Padronização: Padronizamos as variáveis independentes para que todas tenham média 0 e desvio padrão 1.

Aplicação da PCA: Aplicamos PCA às variáveis padronizadas para obter componentes principais não correlacionados.

Seleção de PCs: Escolhemos os componentes principais que explicam uma proporção significativa da variância (neste exemplo, usamos os dois primeiros PCs).

Ajuste do Modelo: Ajustamos o modelo de regressão linear utilizando os componentes principais selecionados.

Diagnóstico e Ajuste Robusto: Realizamos o teste de Breusch-Pagan para verificar a presença de heterocedasticidade e ajustamos o modelo com erros padrão robustos, se necessário.

De volta ao topo

## Citação

Por favor, cite este trabalho como:

PRADO, Alexsandro. **Heterocedasticidade e Autocorrelação: como resolver na prática?** **Blog de Alexsandro Prado**, 22 maio 2024. Disponível em: \<<https://alexsandroprado.site/blog/posts/heterocedasticidade/heterocedasticidade.html>\>
