# GraphQL API

Die API laeuft lokal auf:

```text
http://localhost:4001
```

## Auth

Nach Login oder Registrierung gibt die API ein JWT zurueck. Frontend-Requests senden es als Bearer Token:

```http
Authorization: Bearer <token>
```

## Wichtige Operationen

### Registrierung

```graphql
mutation Register($input: RegisterInput!) {
  register(input: $input) {
    token
    user {
      id
      name
      email
    }
  }
}
```

### Login

```graphql
mutation Login($input: LoginInput!) {
  login(input: $input) {
    token
    user {
      id
      name
      email
    }
  }
}
```

### Schulden abrufen

```graphql
query Debts {
  debtsOwedToMe {
    id
    debtorName
    amount
    purpose
    category
    paidAt
  }
  debtsIOwe {
    id
    creator {
      name
      email
    }
    amount
    purpose
    category
    paidAt
  }
}
```

### Loeschung beantragen

```graphql
mutation RequestDebtDeletion($id: ID!, $reason: String!) {
  requestDebtDeletion(id: $id, reason: $reason) {
    id
    deletionStatus
    deletionReason
    deletionRequestedAt
  }
}
```

### Loeschung bestaetigen

```graphql
mutation ApproveDebtDeletion($id: ID!) {
  approveDebtDeletion(id: $id)
}
```

### Loeschung ablehnen

```graphql
mutation RejectDebtDeletion($id: ID!) {
  rejectDebtDeletion(id: $id) {
    id
    deletionStatus
    deletionRejectedAt
  }
}
```
