import { useEffect, useState } from "react";
import { api } from "../services/api";
import type { AdminUserStat } from "../types";

interface AdminPageProps {
  isAdmin: boolean;
}

function formatDateTime(value?: string) {
  if (!value) {
    return "-";
  }
  return new Date(value).toLocaleString("zh-CN");
}

export function AdminPage({ isAdmin }: AdminPageProps) {
  const [users, setUsers] = useState<AdminUserStat[]>([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!isAdmin) {
      return;
    }

    let active = true;
    setLoading(true);
    setError("");

    api
      .getAdminUsers()
      .then((response) => {
        if (active) {
          setUsers(response.users);
        }
      })
      .catch((requestError) => {
        if (active) {
          setError(requestError instanceof Error ? requestError.message : "加载失败");
        }
      })
      .finally(() => {
        if (active) {
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, [isAdmin]);

  if (!isAdmin) {
    return (
      <section className="rounded-[28px] border border-white/10 bg-white/6 p-6 text-slate-200 backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Admin Observatory</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">用户观测台</h2>
        <p className="mt-3 text-sm text-slate-300/75">你没有权限查看这个页面。</p>
      </section>
    );
  }

  return (
    <div className="space-y-6 pt-[17rem] md:pt-[15.5rem]">
      <section className="rounded-[32px] border border-white/10 bg-white/6 p-6 shadow-soft backdrop-blur-xl">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-300/60">Admin Observatory</p>
        <h2 className="mt-2 text-3xl font-semibold text-white">用户观测台</h2>
        <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-300/78">
          这里可以查看使用你产品的用户列表、注册时间、记录数量、最近活跃时间，以及他们最常出现的主题标签。
        </p>
      </section>

      {loading ? (
        <section className="rounded-[28px] border border-white/10 bg-white/6 p-5 text-sm text-slate-300/76 backdrop-blur-xl">
          正在调取用户星图数据...
        </section>
      ) : null}

      {error ? (
        <section className="rounded-[28px] border border-rose-200/20 bg-rose-100/10 p-5 text-sm text-rose-100 backdrop-blur-xl">
          {error}
        </section>
      ) : null}

      <div className="grid gap-4">
        {users.map((user) => (
          <section key={user.user_id} className="rounded-[28px] border border-white/10 bg-[rgba(8,20,35,0.72)] p-5 backdrop-blur-xl">
            <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
              <div>
                <p className="text-lg font-semibold text-white">{user.email || "未公开邮箱"}</p>
                <p className="mt-1 text-xs text-slate-400">ID: {user.user_id}</p>
              </div>

              <div className="grid gap-2 text-sm text-slate-200/82 md:text-right">
                <p>记录数量: {user.entry_count}</p>
                <p>最近活跃: {formatDateTime(user.latest_entry_at)}</p>
                <p>注册时间: {formatDateTime(user.created_at)}</p>
                <p>最近登录: {formatDateTime(user.last_sign_in_at)}</p>
              </div>
            </div>

            <div className="mt-4 flex flex-wrap gap-2">
              {user.top_tags.length > 0 ? (
                user.top_tags.map((tag) => (
                  <span key={tag.tag} className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-200/84">
                    #{tag.tag} {tag.count}
                  </span>
                ))
              ) : (
                <span className="rounded-full border border-white/10 bg-white/8 px-3 py-1 text-xs text-slate-300/70">暂无标签数据</span>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}
