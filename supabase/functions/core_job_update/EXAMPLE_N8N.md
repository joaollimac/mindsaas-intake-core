# Exemplo de chamada para n8n

## Configuração no n8n

Após finalizar o deploy no n8n, adicione um nó HTTP Request com as seguintes configurações:

### Método
`POST`

### URL
```
https://<seu-projeto>.supabase.co/functions/v1/core_job_update
```

### Headers
```
x-mindsaas-secret: <seu-secret-configurado-no-supabase>
Content-Type: application/json
```

### Body (JSON)
```json
{
  "prd_id": "{{ $json.prd_id }}",
  "state": "DELIVERED",
  "delivered_url": "{{ $json.deployed_url }}"
}
```

### Exemplo completo (n8n Expression)
```json
{
  "prd_id": "{{ $('Criar PRD Instance').item.json.id }}",
  "state": "DELIVERED",
  "delivered_url": "https://app.exemplo.com/prd/{{ $('Criar PRD Instance').item.json.id }}"
}
```

## Resposta esperada

**Sucesso (200):**
```json
{
  "ok": true
}
```

**Erro (401):**
```json
{
  "error": "Unauthorized"
}
```

**Erro (404):**
```json
{
  "error": "PRD instance not found"
}
```

## Notas

- O `prd_id` deve ser o UUID de `public.prd_instances.id`
- Se `state === 'FAILED'`, não é necessário enviar `delivered_url`
- A função atualiza automaticamente `updated_at` em `prd_instances`
- Se a tabela `deliveries` não existir, a função continua normalmente (não falha)

