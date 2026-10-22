import React from 'react';
import { Users, Award, Shield } from 'lucide-react';

interface RingMember {
  id: number;
  full_name: string;
  group_code: string;
  avatar: string | null;
  attendance_rate: string;
}

interface MyRingSectionProps {
  ringName: string;
  members: RingMember[];
  title?: string;
}

export const MyRingSection: React.FC<MyRingSectionProps> = ({
  ringName,
  members,
  title = "حلقه شما"
}) => {
  return (
    <div className="bg-slate-900/60 backdrop-blur-xl border border-cyan-500/20 rounded-2xl p-6 shadow-lg shadow-cyan-950/30">
      {/* سربرگ بخش حلقه */}
      <div className="flex items-center justify-between pb-4 border-b border-slate-700/50 mb-5">
        <div className="flex items-center gap-3">
          <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 text-cyan-400">
            <Users className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            <p className="text-xs text-slate-400">نام حلقه: <span className="text-cyan-400 font-medium">{ringName}</span></p>
          </div>
        </div>
        <span className="px-3 py-1 rounded-full text-xs font-semibold bg-cyan-950/70 border border-cyan-500/40 text-cyan-300">
          {members.length} عضو
        </span>
      </div>

      {/* لیست و گرید کارت اعضا */}
      {members.length === 0 ? (
        <div className="text-center py-6 text-slate-500 text-sm">
          عضوی در این حلقه یافت نشد یا شما هنوز عضوی از حلقه نیستید.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {members.map((member) => (
            <div
              key={member.id}
              className="group relative flex items-center gap-3.5 p-3.5 rounded-xl bg-slate-800/40 hover:bg-slate-800/80 border border-slate-700/40 hover:border-cyan-500/50 transition-all duration-300 shadow-sm"
            >
              {/* آواتار عضو */}
              <div className="relative">
                {member.avatar ? (
                  <img
                    src={member.avatar}
                    alt={member.full_name}
                    className="w-12 h-12 rounded-xl object-cover border border-cyan-500/30 group-hover:border-cyan-400"
                  />
                ) : (
                  <div className="w-12 h-12 rounded-xl bg-slate-700/60 border border-slate-600 flex items-center justify-center text-cyan-400 font-bold text-base">
                    {member.full_name.charAt(0) || "U"}
                  </div>
                )}
                <div className="absolute -bottom-1 -right-1 p-0.5 bg-slate-900 rounded-full">
                  <Shield className="w-3 h-3 text-cyan-400" />
                </div>
              </div>

              {/* مشخصات و درصد حضور */}
              <div className="flex-1 min-w-0">
                <h4 className="text-sm font-semibold text-white truncate group-hover:text-cyan-300 transition-colors">
                  {member.full_name}
                </h4>
                <p className="text-xs text-slate-400 font-mono mt-0.5">
                  کد: {member.group_code}
                </p>
              </div>

              {/* بچ درصد حضور زنده از شیت */}
              <div className="flex flex-col items-end">
                <span className="text-[11px] text-slate-400 flex items-center gap-1">
                  <Award className="w-3 h-3 text-emerald-400" />
                  حضور
                </span>
                <span className="text-xs font-bold text-emerald-400 font-mono mt-0.5">
                  {member.attendance_rate}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};