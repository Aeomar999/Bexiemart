import { auth } from "./src/auth/better-auth";
async function run() {
  try {
    const ts = Date.now();
    const email = `test${ts}@test.com`;
    const res = await auth.api.signUpEmail({
      body: { email: email, password: "password123", name: "Test" },
      headers: {} as Headers,
      asResponse: true
    });
    
    console.log("Headers:");
    res.headers.forEach((val, key) => console.log(key, ":", val));
    
    const cookie = res.headers.get("set-cookie");
    console.log("Cookie:", cookie);
    
    // Parse cookie to get token
    const tokenMatch = cookie?.match(/better-auth\.session_token=([^;]+)/);
    const token = tokenMatch ? tokenMatch[1] : null;
    
    if (token) {
        const headers = {} as Headers;
        (headers as any).set = (k: string, v: string) => { (headers as any)[k] = v };
        headers.set("cookie", `better-auth.session_token=${token}`);
        const session = await auth.api.getSession({ headers });
        console.log("Session valid with cookie token:", !!session?.user);
    }
  } catch (e) {
    console.error("Auth error:", e);
  }
}
run();
