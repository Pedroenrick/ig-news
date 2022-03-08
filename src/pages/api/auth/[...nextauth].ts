import NextAuth, { Account, Profile, User } from "next-auth";
import { query } from "faunadb";
import GithubProvider from "next-auth/providers/github";

import { fauna } from "../../../services/fauna";

interface signInProps {
  user: User;
  account: Account;
  profile: Profile;
  email: {
    verificationRequest?: boolean;
  };
}

export default NextAuth({
  providers: [
    GithubProvider({
      clientId: process.env.GITHUB_CLIENT_ID,
      clientSecret: process.env.GITHUB_CLIENT_SECRET,
    }),
  ],

  callbacks: {
    async signIn({ user, account, profile }: signInProps) {
      const { email } = user;

      try {
        await fauna.query(
          query.If(
            query.Not(
              query.Exists(
                query.Match(
                  query.Index("user_by_email"),
                  query.Casefold(user.email)
                )
              )
            ),
            query.Create(query.Collection("user"), { data: { email } }),
            query.Get(
              query.Match(
                query.Index("user_by_email"),
                query.Casefold(user.email)
              )
            )
          )
        );

        return true;
      } catch (err) {
        console.error(err);
        return false;
      }
    },
  },
});
