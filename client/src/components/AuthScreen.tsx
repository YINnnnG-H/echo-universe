import { LoaderCircle, LockKeyhole, LogIn, Sparkles, UserPlus } from "lucide-react";
import { useState, type FormEvent } from "react";
import { isSupabaseConfigured, supabase } from "../services/supabase";

type AuthMode = "signin" | "signup";

export function AuthScreen() {
  const [mode, setMode] = useState<AuthMode>("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!isSupabaseConfigured) {
      setError("还没有配置 Supabase，请先补全 VITE_SUPABASE_URL 和 VITE_SUPABASE_ANON_KEY。");
      return;
    }

    setIsSubmitting(true);
    setError("");
    setMessage("");

    try {
      if (mode === "signin") {
        const { error: signInError } = await supabase.auth.signInWithPassword({
          email: email.trim(),
          password
        });

        if (signInError) {
          throw signInError;
        }

        setMessage("正在进入你的宇宙档案...");
      } else {
        const { data, error: signUpError } = await supabase.auth.signUp({
          email: email.trim(),
          password,
          options: {
            emailRedirectTo: window.location.origin
          }
        });

        if (signUpError) {
          throw signUpError;
        }

        if (data.session) {
          setMessage("账号创建成功，正在进入你的宇宙...");
        } else {
          setMessage("账号创建成功，请先去邮箱完成验证，再回来登录。");
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "登录失败，请稍后重试。");
    } finally {
      setIsSubmitting(false);
    }
  }

  const inputClass =
    "h-12 rounded-full border border-white/12 bg-[#102139] px-4 text-sm text-slate-50 outline-none transition placeholder:text-slate-400/70 focus:border-[#8fb0d6]";

  return (
    <div className="relative flex min-h-screen items-center justify-center overflow-hidden px-4 py-10">
      <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(111,146,183,0.16),transparent_24%),radial-gradient(circle_at_80%_18%,rgba(244,215,161,0.12),transparent_22%),radial-gradient(circle_at_50%_80%,rgba(114,95,168,0.18),transparent_30%)]" />
      <div className="pointer-events-none absolute left-[10%] top-[18%] h-40 w-40 rounded-full bg-[radial-gradient(circle,rgba(255,255,255,0.24),rgba(255,255,255,0))] blur-3xl" />
      <div className="relative w-full max-w-md overflow-hidden rounded-[32px] border border-white/10 bg-[rgba(7,17,31,0.82)] p-6 shadow-[0_40px_100px_rgba(2,6,16,0.4)] backdrop-blur-2xl">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(244,215,161,0.12),transparent_34%),radial-gradient(circle_at_bottom_left,rgba(123,166,201,0.14),transparent_36%)]" />
        <form onSubmit={handleSubmit} className="relative space-y-5">
          <div>
            <p className="text-[11px] uppercase tracking-[0.34em] text-slate-300/62">EchoLand Passport</p>
            <h1 className="mt-2 text-3xl font-semibold text-white">进入你的私人宇宙</h1>
            <p className="mt-3 text-sm leading-7 text-slate-300/76">
              每个人都拥有自己的星云、标签、心情轨迹和回声档案。登录后，数据会自动只属于你自己。
            </p>
          </div>

          <div className="flex rounded-full border border-white/10 bg-white/6 p-1">
            <button
              type="button"
              onClick={() => setMode("signin")}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
                mode === "signin" ? "bg-white/14 text-white" : "text-slate-300/72"
              }`}
            >
              登录
            </button>
            <button
              type="button"
              onClick={() => setMode("signup")}
              className={`flex-1 rounded-full px-4 py-2 text-sm transition ${
                mode === "signup" ? "bg-white/14 text-white" : "text-slate-300/72"
              }`}
            >
              注册
            </button>
          </div>

          <div className="space-y-3">
            <input
              type="email"
              value={email}
              onChange={(event) => setEmail(event.target.value)}
              placeholder="邮箱"
              autoComplete="email"
              className={inputClass}
            />
            <input
              type="password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="密码（至少 6 位）"
              autoComplete={mode === "signin" ? "current-password" : "new-password"}
              className={inputClass}
            />
          </div>

          {!isSupabaseConfigured ? (
            <div className="rounded-[22px] border border-amber-200/20 bg-amber-100/10 px-4 py-3 text-sm leading-6 text-amber-50">
              当前还没接好 Supabase Auth。先把本地 `.env` 和 Railway 里的 `VITE_SUPABASE_URL`、
              `VITE_SUPABASE_ANON_KEY`、`SUPABASE_URL` 配好，就可以开始让朋友独立使用了。
            </div>
          ) : null}

          {error ? (
            <div className="rounded-[22px] border border-rose-200/20 bg-rose-100/10 px-4 py-3 text-sm leading-6 text-rose-100">
              {error}
            </div>
          ) : null}

          {message ? (
            <div className="rounded-[22px] border border-emerald-200/20 bg-emerald-100/10 px-4 py-3 text-sm leading-6 text-emerald-50">
              {message}
            </div>
          ) : null}

          <button
            type="submit"
            disabled={isSubmitting}
            className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-full bg-[#f4d7a1]/18 px-5 text-sm font-medium text-[#f6e8ca] shadow-[0_0_24px_rgba(244,215,161,0.14)] transition hover:scale-[1.01] disabled:opacity-70"
          >
            {isSubmitting ? <LoaderCircle size={16} className="animate-spin" /> : null}
            {mode === "signin" ? <LogIn size={16} /> : <UserPlus size={16} />}
            {mode === "signin" ? "进入宇宙" : "创建宇宙账号"}
          </button>

          <div className="grid gap-3 rounded-[24px] border border-white/10 bg-white/6 p-4 text-sm text-slate-300/76">
            <div className="flex items-center gap-2 text-slate-100">
              <Sparkles size={16} />
              <span>每位使用者都会拥有独立的记录、主题网络和 AI 分析结果。</span>
            </div>
            <div className="flex items-center gap-2">
              <LockKeyhole size={16} />
              <span>如果你是原始创建者，首次登录时系统会自动认领历史旧数据。</span>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
