export const toGraphQLUser = (user: {
  id: string;
  name: string;
  email: string;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  createdAt: user.createdAt.toISOString(),
});
