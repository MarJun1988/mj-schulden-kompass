export const toGraphQLUser = (user: {
  id: string;
  name: string;
  email: string;
  emailVerifiedAt: Date | null;
  createdAt: Date;
}) => ({
  id: user.id,
  name: user.name,
  email: user.email,
  emailVerifiedAt: user.emailVerifiedAt?.toISOString() ?? null,
  createdAt: user.createdAt.toISOString(),
});
