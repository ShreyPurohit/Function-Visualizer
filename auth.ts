import NextAuth from "next-auth"
import GitHub from "next-auth/providers/github"

export const { handlers, auth, signIn, signOut } = NextAuth({
    providers: [GitHub],
    callbacks: {
        async signIn({ user: { name, email, image }, profile }) {
            console.log('GitHub Profile:', profile)
            return true
        },
        async jwt({ token, account, profile }) {
            if (account) {
                token.accessToken = account.access_token
                token.id = profile?.id
            }
            return token
        },
        async session({ session, token }) {
            Object.assign(session, { id: token.id })
            return session
        }
    }
})