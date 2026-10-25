import React, { useState, useEffect } from 'react';
import {
  Search,
  Filter,
  Star,
  Clock,
  CheckCircle,
  Briefcase,
  DollarSign,
  ShieldCheck,
  Send,
  Sparkles,
  ShoppingBag
} from 'lucide-react';
import { User, ClientProfile, ServiceListing } from '../../types/index.js';
import { api } from '../../services/api.js';

interface DiscoverServicesProps {
  user: User;
  profile: ClientProfile;
  onNavigateToPurchases?: () => void;
  onOpenMessage?: (studentId: string, studentName: string) => void;
}

export const DiscoverServices: React.FC<DiscoverServicesProps> = ({
  user,
  profile,
  onNavigateToPurchases,
  onOpenMessage
}) => {
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [branchFilter, setBranchFilter] = useState('all');
  const [selectedService, setSelectedService] = useState<ServiceListing | null>(null);
  const [orderScope, setOrderScope] = useState('');
  const [orderDeadline, setOrderDeadline] = useState('');
  const [placingOrder, setPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState<any | null>(null);

  const loadServices = async () => {
    try {
      setLoading(true);
      const res = await api.getMarketplaceServices({
        search: searchTerm || undefined,
        branchId: branchFilter !== 'all' ? branchFilter : undefined,
        status: 'active'
      });
      if (res.success) {
        setServices(res.services);
      }
    } catch (err) {
      console.error('Failed to load services:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadServices();
  }, [branchFilter]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    loadServices();
  };

  const handlePlaceOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedService || !orderScope.trim()) return;

    try {
      setPlacingOrder(true);
      const targetDeadline =
        orderDeadline ||
        new Date(Date.now() + (selectedService.deliveryDays || 3) * 86400000)
          .toISOString()
          .split('T')[0];

      const res = await api.createMarketplaceOrder({
        serviceId: selectedService.id,
        clientId: user.id,
        clientName: profile?.name || user.name,
        clientOrganization: profile?.organization || 'Industrial Client',
        scopeDetails: orderScope.trim(),
        deadline: targetDeadline
      });

      if (res.success) {
        setOrderSuccess(res.order);
        setSelectedService(null);
        setOrderScope('');
        setOrderDeadline('');
      }
    } catch (err: any) {
      alert(err.message || 'Failed to place service order');
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <ShoppingBag className="w-3.5 h-3.5" />
              Alwar Polytechnic Talent Catalog
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Hire Verified Polytechnic Talent
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Connect with skilled polytechnic students across Computer, Mechanical, Electrical, Civil, and Electronics departments. Order drafting, web development, IoT telemetry, and embedded engineering services.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-xs px-3 py-1.5 rounded-xl bg-slate-800/80 border border-slate-700 text-slate-300 font-medium">
              Demo Escrow: <strong className="text-emerald-400">Pre-Funded Active</strong>
            </span>
          </div>
        </div>
      </div>

      {/* Filter and Search */}
      <div className="flex flex-col md:flex-row gap-4 bg-slate-900/40 border border-slate-800 p-4 rounded-2xl">
        <form onSubmit={handleSearchSubmit} className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search services (e.g. AutoCAD, Python, PLC, PCB design, React)..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full bg-slate-950 border border-slate-800 rounded-xl pl-10 pr-4 py-2 text-sm text-white focus:outline-none focus:border-cyan-400 placeholder:text-slate-500"
          />
        </form>

        <div className="flex items-center gap-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={branchFilter}
            onChange={e => setBranchFilter(e.target.value)}
            className="bg-slate-950 border border-slate-800 rounded-xl px-3 py-2 text-xs font-semibold text-white focus:outline-none focus:border-cyan-400 cursor-pointer"
          >
            <option value="all">All Departments</option>
            <option value="branch-cse">Computer Science & Engineering</option>
            <option value="branch-me">Mechanical Engineering</option>
            <option value="branch-ee">Electrical Engineering</option>
            <option value="branch-ce">Civil Engineering</option>
            <option value="branch-ece">Electronics & Communication</option>
            <option value="branch-auto">Automobile Engineering</option>
            <option value="branch-che">Chemical Engineering</option>
            <option value="branch-it">Information Technology</option>
          </select>
        </div>
      </div>

      {/* Services Grid */}
      {loading ? (
        <div className="text-center py-12 text-slate-400">Loading student service catalog...</div>
      ) : services.length === 0 ? (
        <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
          <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
          <h3 className="text-lg font-bold text-white">No Services Found</h3>
          <p className="text-slate-400 text-sm mt-1">Try broadening your search query or department filter.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {services.map(service => (
            <div
              key={service.id}
              className="bg-slate-900/70 border border-slate-800 hover:border-slate-700 rounded-2xl p-5 flex flex-col justify-between transition-all group"
            >
              <div>
                <div className="flex justify-between items-start gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-md bg-cyan-500/10 text-cyan-400 text-xs font-semibold">
                    {service.branchName.replace('& Engineering', '')}
                  </span>
                  <div className="flex items-center gap-1 text-amber-400 text-xs font-bold">
                    <Star className="w-3.5 h-3.5 fill-current" />
                    {service.rating.toFixed(1)} ({service.reviewCount})
                  </div>
                </div>

                <h3 className="font-bold text-white text-base group-hover:text-cyan-400 transition-colors line-clamp-2">
                  {service.title}
                </h3>

                <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                  {service.description}
                </p>

                <div className="flex items-center gap-2 mt-3 pt-3 border-t border-slate-800/60">
                  <div className="w-6 h-6 rounded-full bg-cyan-500/20 text-cyan-400 font-bold text-[10px] flex items-center justify-center">
                    {service.studentName.charAt(0)}
                  </div>
                  <div className="overflow-hidden">
                    <p className="text-xs font-bold text-slate-200 truncate">{service.studentName}</p>
                    <p className="text-[10px] text-slate-500 font-mono">{service.studentPin}</p>
                  </div>
                </div>

                <div className="flex flex-wrap gap-1.5 mt-3">
                  {service.skills.map((skill, i) => (
                    <span key={i} className="text-[11px] bg-slate-800 text-slate-300 px-2 py-0.5 rounded-md">
                      {skill}
                    </span>
                  ))}
                </div>
              </div>

              <div className="pt-4 mt-4 border-t border-slate-800/80 flex items-center justify-between">
                <div>
                  <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Pricing</p>
                  <p className="text-xl font-black text-white">₹{service.price}</p>
                  <div className="flex items-center gap-1 text-slate-400 text-[11px]">
                    <Clock className="w-3 h-3" /> {service.deliveryDays} days
                  </div>
                </div>

                <button
                  onClick={() => setSelectedService(service)}
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0B192C] font-bold text-xs shadow-md shadow-cyan-500/20 cursor-pointer"
                >
                  Order Service
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Order Service Modal */}
      {selectedService && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Place Service Order</h3>
            <p className="text-xs text-slate-400 mb-4">
              Service: <strong className="text-white">{selectedService.title}</strong>
            </p>

            <form onSubmit={handlePlaceOrder} className="space-y-4">
              <div className="bg-slate-900 p-3.5 rounded-xl border border-slate-800 text-xs space-y-1">
                <div className="flex justify-between">
                  <span className="text-slate-400">Freelancer Student:</span>
                  <span className="font-bold text-white">{selectedService.studentName} ({selectedService.studentPin})</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-slate-400">Standard Delivery:</span>
                  <span className="text-slate-200">{selectedService.deliveryDays} Days</span>
                </div>
                <div className="flex justify-between text-emerald-400 font-bold pt-1 border-t border-slate-800">
                  <span>Total Amount (INR):</span>
                  <span>₹{selectedService.price}</span>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Project Scope & Requirements *
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Describe the task in detail, required output files, component specifications, or schematics..."
                  value={orderScope}
                  onChange={e => setOrderScope(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Required Completion Date (Optional)
                </label>
                <input
                  type="date"
                  value={orderDeadline}
                  onChange={e => setOrderDeadline(e.target.value)}
                  className="w-full bg-slate-950 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="bg-cyan-950/20 border border-cyan-800/40 rounded-xl p-3 text-xs text-cyan-300 flex items-start gap-2">
                <ShieldCheck className="w-4 h-4 shrink-0 text-cyan-400 mt-0.5" />
                <span>
                  <strong>Escrow Protection Active:</strong> Payment is pre-verified in portal test escrow and only released to the student after you approve deliverables.
                </span>
              </div>

              <div className="flex justify-end gap-3 pt-3 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setSelectedService(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-xs font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={placingOrder || !orderScope.trim()}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#0B192C] text-xs font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  {placingOrder ? 'Processing...' : `Confirm Order (₹${selectedService.price})`}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Order Success Confirmation Modal */}
      {orderSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-emerald-700/80 rounded-2xl w-full max-w-md p-6 text-center shadow-2xl">
            <div className="w-12 h-12 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center mx-auto mb-3">
              <CheckCircle className="w-6 h-6" />
            </div>

            <h3 className="text-xl font-black text-white">Order Placed Successfully!</h3>
            <p className="text-xs text-slate-300 mt-1 mb-4">
              Order Number: <strong className="text-cyan-400 font-mono">{orderSuccess.orderNumber}</strong>
            </p>

            <div className="bg-slate-900 border border-slate-800 rounded-xl p-4 text-xs text-left text-slate-400 space-y-1.5 mb-5">
              <p>Service: <strong className="text-white">{orderSuccess.serviceTitle}</strong></p>
              <p>Freelancer: <strong className="text-white">{orderSuccess.studentName}</strong></p>
              <p>Amount: <strong className="text-emerald-400">₹{orderSuccess.amount}</strong></p>
              <p>Deadline: <strong className="text-white">{orderSuccess.deadline}</strong></p>
            </div>

            <div className="flex justify-center gap-3">
              <button
                onClick={() => setOrderSuccess(null)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0B192C] font-bold text-xs cursor-pointer"
              >
                Continue Browsing
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
