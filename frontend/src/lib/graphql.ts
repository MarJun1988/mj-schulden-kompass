const tokenKey = "schuldkompass-token";

interface GraphQLErrorPayload {
  message: string;
}

export interface GraphQLResponse<TData> {
  data?: TData;
  errors?: GraphQLErrorPayload[];
}

export const getAuthToken = () => localStorage.getItem(tokenKey);

export const setAuthToken = (token: string | null) => {
  if (token) {
    localStorage.setItem(tokenKey, token);
  } else {
    localStorage.removeItem(tokenKey);
  }
};

export const gql = async <TData>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<GraphQLResponse<TData>> => {
  const token = getAuthToken();
  const response = await fetch("/graphql", {
    method: "POST",
    headers: {
      "content-type": "application/json",
      ...(token ? { authorization: `Bearer ${token}` } : {}),
    },
    body: JSON.stringify({ query, variables }),
  });

  if (!response.ok) {
    throw new Error(`GraphQL request failed with ${response.status}`);
  }

  const payload = (await response.json()) as GraphQLResponse<TData>;
  if (payload.errors?.length) {
    throw new Error(payload.errors.map((error) => error.message).join(", "));
  }

  return payload;
};
