export function betterAuth(config?: any) {
  return {
    api: {
      signUpEmail: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
      signInEmail: () => Promise.resolve({ ok: true, json: () => Promise.resolve({}) }),
      sendVerificationEmail: () => Promise.resolve({}),
      forgetPassword: () => Promise.resolve({}),
      resetPassword: () => Promise.resolve({}),
    },
    handler: (req: any, res: any) => {},
  };
}

export function prismaAdapter(prisma: any, options?: any) {
  return {};
}

export function phoneNumber(config?: any) {
  return (ctx: any) => {};
}

export function toNodeHandler(auth: any) {
  return (req: any, res: any) => {};
}
