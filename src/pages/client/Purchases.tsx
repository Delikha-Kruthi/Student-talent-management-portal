import React, { useState, useEffect } from 'react';
import { Purchase, User, ClientProfile } from '../../types/index.js';
import { api } from '../../services/api.js';
import { ShoppingBag, Download, Key, ShieldCheck, CheckCircle2, FileText, ExternalLink, Loader2 } from 'lucide-react';

interface PurchasesProps {
  user: User;
  profile: ClientProfile | null;
}

export const Purchases: React.FC<PurchasesProps> = ({ user, profile }) => {
  const [purchases, setPurchases] = useState<Purchase[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPurchases();
  }, [user.id]);

  const loadPurchases = async () => {
    setLoading(true);
    try {
      const res = await api.getPurchases(user.id);
      if (res.purchases) setPurchases(res.purchases);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadDeliverables = (purchase: Purchase) => {
    window.location.href = purchase.downloadUrl;
  };

  return (
    <div className="space-y-6">
      <div className="p-6 bg-slate-900 border border-slate-800 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <h2 className="text-xl font-bold text-white flex items-center gap-2">
            <ShoppingBag className="w-5 h-5 text-[#00D4F5]" />
            Licensed Deliverables & Commercial Rights
          </h2>
          <p className="text-xs text-slate-400 mt-1">
            Access authorized source code, PCB schematics, documentation, and IP license certificates.
          </p>
        </div>
      </div>

      {loading ? (
        <div className="py-12 flex flex-col items-center justify-center text-slate-400">
          <Loader2 className="w-8 h-8 text-[#00D4F5] animate-spin mb-2" />
          <p className="text-xs">Loading license records...</p>
        </div>
      ) : purchases.length === 0 ? (
        <div className="p-12 text-center bg-slate-900/40 border border-slate-800 rounded-2xl space-y-3">
          <p className="text-sm font-semibold text-slate-300">No project licenses purchased yet.</p>
          <p className="text-xs text-slate-500">Visit Discover Projects to license vetted student inventions.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {purchases.map((pur) => (
            <div
              key={pur.id}
              className="p-6 bg-slate-900 border border-slate-800 hover:border-cyan-500/40 rounded-2xl shadow-xl space-y-4 transition-all"
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-slate-800/80 pb-3">
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-bold text-cyan-400">
                      Order: {pur.orderNumber}
                    </span>
                    <span className="text-[10px] font-bold uppercase px-2 py-0.5 rounded bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                      {pur.status}
                    </span>
                  </div>
                  <h3 className="text-base font-bold text-white">{pur.projectTitle}</h3>
                  <p className="text-xs text-slate-400">
                    Inventor: <strong className="text-slate-200">{pur.studentName}</strong> (PIN: {pur.studentPin})
                  </p>
                </div>

                <div className="text-right">
                  <span className="text-sm font-bold text-white block">
                    ₹{pur.amount.toLocaleString()} INR
                  </span>
                  <span className="text-[10px] text-slate-500 block">
                    {new Date(pur.createdAt).toLocaleDateString()}
                  </span>
                </div>
              </div>

              {/* License Key & Verification Info */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-cyan-400" />
                    Authorized License Key
                  </span>
                  <div className="font-mono text-cyan-300 font-bold bg-slate-900 px-3 py-1.5 rounded border border-cyan-900/50 select-all">
                    {pur.licenseKey}
                  </div>
                  <span className="text-[10px] text-slate-500">
                    Grant: {pur.licenseType}
                  </span>
                </div>

                <div className="p-3.5 bg-slate-950/80 border border-slate-800 rounded-xl space-y-1.5">
                  <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                    Deliverables Package Manifest
                  </span>
                  <ul className="space-y-1 text-slate-300 text-[11px]">
                    {pur.deliverableFiles.map((file, idx) => (
                      <li key={idx} className="flex items-center gap-1.5 truncate">
                        <CheckCircle2 className="w-3 h-3 text-emerald-400 shrink-0" />
                        <span className="truncate">{file}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              </div>

              {/* Download Action */}
              <div className="flex justify-end pt-2">
                <button
                  onClick={() => handleDownloadDeliverables(pur)}
                  className="inline-flex items-center gap-2 px-4 py-2 bg-[#00D4F5] hover:bg-[#00b9d6] text-[#0B192C] font-extrabold text-xs rounded-xl shadow-lg shadow-cyan-500/20 transition-all cursor-pointer"
                >
                  <Download className="w-4 h-4" />
                  Download Deliverable Package & Certificate
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};
