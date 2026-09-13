import { useAuth } from './auth-context';

export function LoginPage() {
  const { signInWithGoogle, signInWithGithub } = useAuth();

  return (
    <main className="login-page">
      <div className="login-card">
        <h1>UnoWeb</h1>
        <p>Universal embedded development platform.</p>
        <button onClick={() => void signInWithGoogle()}>
          Continue with Google
        </button>
        <button onClick={() => void signInWithGithub()}>
          Continue with GitHub
        </button>
      </div>
    </main>
  );
}
