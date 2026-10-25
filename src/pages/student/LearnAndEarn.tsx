import React, { useState, useEffect } from 'react';
import {
  DollarSign,
  Plus,
  Briefcase,
  Clock,
  Star,
  CheckCircle,
  AlertCircle,
  Package,
  ExternalLink,
  Edit2,
  Trash2,
  Send,
  Sparkles
} from 'lucide-react';
import { User, StudentProfile, ServiceListing, ServiceOrder } from '../../types/index.js';
import { api } from '../../services/api.js';

interface LearnAndEarnProps {
  user: User;
  profile: StudentProfile;
}

export const LearnAndEarn: React.FC<LearnAndEarnProps> = ({ user, profile }) => {
  const [activeSubTab, setActiveSubTab] = useState<'services' | 'orders' | 'earnings'>('services');
  const [services, setServices] = useState<ServiceListing[]>([]);
  const [orders, setOrders] = useState<ServiceOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showDeliverModal, setShowDeliverModal] = useState<ServiceOrder | null>(null);
  const [deliverableNotes, setDeliverableNotes] = useState('');
  const [deliverableFileUrl, setDeliverableFileUrl] = useState('');
  const [submittingDeliverable, setSubmittingDeliverable] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    price: 800,
    deliveryDays: 3,
    skillsInput: ''
  });

  const loadData = async () => {
    try {
      setLoading(true);
      const [srvRes, ordRes] = await Promise.all([
        api.getMarketplaceServices({ studentId: user.id }),
        api.getMarketplaceOrders({ studentId: user.id })
      ]);
      if (srvRes.success) setServices(srvRes.services);
      if (ordRes.success) setOrders(ordRes.orders);
    } catch (err) {
      console.error('Failed to load marketplace data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [user.id]);

  const handleCreateService = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.title || !formData.price) return;

    const skills = formData.skillsInput
      .split(',')
      .map(s => s.trim())
      .filter(Boolean);

    try {
      const res = await api.createMarketplaceService({
        studentId: user.id,
        studentName: profile?.name || user.name,
        studentPin: profile?.pin || 'AP-2023-CS-042',
        branchId: profile?.branchId || 'branch-cse',
        branchName: profile?.branchName || 'Computer Science & Engineering',
        title: formData.title,
        description: formData.description,
        price: Number(formData.price),
        deliveryDays: Number(formData.deliveryDays),
        skills: skills.length > 0 ? skills : ['Technical Support', 'Engineering Design']
      });

      if (res.success) {
        setShowCreateModal(false);
        setFormData({ title: '', description: '', price: 800, deliveryDays: 3, skillsInput: '' });
        loadData();
      }
    } catch (err: any) {
      alert(err.message || 'Failed to create service listing');
    }
  };

  const handleDeleteService = async (id: string) => {
    if (!confirm('Are you sure you want to remove this service listing?')) return;
    try {
      await api.deleteMarketplaceService(id);
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to delete service');
    }
  };

  const handleAcceptOrder = async (orderId: string) => {
    try {
      await api.updateOrderStatus(orderId, { status: 'in_progress' });
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to update order');
    }
  };

  const handleSubmitDeliverable = async () => {
    if (!showDeliverModal) return;
    try {
      setSubmittingDeliverable(true);
      await api.updateOrderStatus(showDeliverModal.id, {
        status: 'submitted',
        deliverableNotes,
        deliverableFiles: deliverableFileUrl ? [deliverableFileUrl] : ['https://github.com/alwarpolytechnic-demo/deliverables']
      });
      setShowDeliverModal(null);
      setDeliverableNotes('');
      setDeliverableFileUrl('');
      loadData();
    } catch (err: any) {
      alert(err.message || 'Failed to submit deliverable');
    } finally {
      setSubmittingDeliverable(false);
    }
  };

  // Calculations
  const completedOrders = orders.filter(o => o.status === 'completed');
  const activeOrders = orders.filter(o => ['requested', 'accepted', 'in_progress', 'submitted'].includes(o.status));
  const totalEarnings = completedOrders.reduce((sum, o) => sum + (o.amount || 0), 0);
  const pendingEarnings = activeOrders.reduce((sum, o) => sum + (o.amount || 0), 0);

  return (
    <div className="space-y-6">
      {/* Top Banner */}
      <div className="bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 border border-indigo-800/40 rounded-2xl p-6 shadow-xl relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 w-80 bg-cyan-500/5 blur-3xl rounded-full pointer-events-none" />
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 relative z-10">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-cyan-500/20 text-cyan-400 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5" />
              Learn & Earn Micro-Freelancing Portal
            </div>
            <h1 className="text-2xl font-black text-white tracking-tight">
              Monetize Your Polytechnic Skills
            </h1>
            <p className="text-slate-400 text-sm mt-1 max-w-2xl">
              Offer engineering, drafting, IoT programming, and digital services to faculty, alumni, and local industrial clients in the Alwar & Matsya Industrial Area (MIA).
            </p>
          </div>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-400 hover:to-blue-500 text-[#0B192C] font-bold text-sm shadow-lg shadow-cyan-500/20 transition-all shrink-0 cursor-pointer"
          >
            <Plus className="w-4 h-4" />
            Post New Service
          </button>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-800">
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Total Earned</p>
            <p className="text-xl font-black text-emerald-400 mt-1">₹{totalEarnings.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">In Escrow / Active</p>
            <p className="text-xl font-black text-cyan-400 mt-1">₹{pendingEarnings.toLocaleString('en-IN')}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Active Orders</p>
            <p className="text-xl font-black text-amber-400 mt-1">{activeOrders.length}</p>
          </div>
          <div className="bg-slate-900/60 border border-slate-800 rounded-xl p-3">
            <p className="text-xs text-slate-400 font-medium">Live Services</p>
            <p className="text-xl font-black text-white mt-1">{services.filter(s => s.status === 'active').length}</p>
          </div>
        </div>
      </div>

      {/* Sub navigation */}
      <div className="flex border-b border-slate-800 gap-4">
        <button
          onClick={() => setActiveSubTab('services')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
            activeSubTab === 'services'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          My Listed Services ({services.length})
        </button>
        <button
          onClick={() => setActiveSubTab('orders')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 cursor-pointer flex items-center gap-2 ${
            activeSubTab === 'orders'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Client Orders ({orders.length})
          {activeOrders.length > 0 && (
            <span className="w-5 h-5 rounded-full bg-cyan-500 text-[#0B192C] text-xs font-bold flex items-center justify-center">
              {activeOrders.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveSubTab('earnings')}
          className={`pb-3 font-semibold text-sm transition-colors border-b-2 cursor-pointer ${
            activeSubTab === 'earnings'
              ? 'text-cyan-400 border-cyan-400'
              : 'text-slate-400 border-transparent hover:text-slate-200'
          }`}
        >
          Earnings & Reviews
        </button>
      </div>

      {/* Tab 1: Services */}
      {activeSubTab === 'services' && (
        <div className="space-y-4">
          {loading ? (
            <div className="text-center py-12 text-slate-400">Loading your services...</div>
          ) : services.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Package className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Active Service Listings</h3>
              <p className="text-slate-400 text-sm max-w-md mx-auto mt-1 mb-5">
                You haven't listed any freelance services yet. Put your CAD, embedded C, Python, or PLC skills to work for local clients.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="px-5 py-2.5 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0B192C] font-bold text-sm cursor-pointer"
              >
                Create Your First Service
              </button>
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

                    <p className="text-slate-400 text-xs mt-2 line-clamp-3 leading-relaxed">
                      {service.description}
                    </p>

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
                      <p className="text-[10px] text-slate-500 uppercase tracking-wider font-semibold">Base Price</p>
                      <p className="text-lg font-black text-white">₹{service.price}</p>
                    </div>
                    <div className="text-right">
                      <div className="flex items-center gap-1 text-slate-400 text-xs mb-1">
                        <Clock className="w-3.5 h-3.5" />
                        {service.deliveryDays}d delivery
                      </div>
                      <button
                        onClick={() => handleDeleteService(service.id)}
                        className="text-red-400 hover:text-red-300 text-xs font-semibold flex items-center gap-1 cursor-pointer"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        Remove
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Orders */}
      {activeSubTab === 'orders' && (
        <div className="space-y-4">
          {orders.length === 0 ? (
            <div className="text-center py-16 bg-slate-900/40 border border-slate-800 rounded-2xl">
              <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-3" />
              <h3 className="text-lg font-bold text-white">No Client Orders Yet</h3>
              <p className="text-slate-400 text-sm mt-1">
                When clients request your services from the catalog, their orders will appear here.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {orders.map(order => {
                const isRequested = order.status === 'requested';
                const isInProgress = order.status === 'accepted' || order.status === 'in_progress';
                const isSubmitted = order.status === 'submitted';
                const isCompleted = order.status === 'completed';

                return (
                  <div
                    key={order.id}
                    className="bg-slate-900/70 border border-slate-800 rounded-2xl p-5 flex flex-col md:flex-row items-start md:items-center justify-between gap-4"
                  >
                    <div className="space-y-1.5 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-mono font-bold text-cyan-400">{order.orderNumber}</span>
                        <span
                          className={`text-[11px] font-bold px-2 py-0.5 rounded-full capitalize ${
                            isCompleted
                              ? 'bg-emerald-500/20 text-emerald-400'
                              : isSubmitted
                              ? 'bg-blue-500/20 text-blue-400'
                              : isInProgress
                              ? 'bg-amber-500/20 text-amber-400'
                              : 'bg-slate-800 text-slate-300'
                          }`}
                        >
                          {order.status.replace('_', ' ')}
                        </span>
                        <span className="text-xs text-slate-500">• Due: {order.deadline}</span>
                      </div>

                      <h4 className="font-bold text-white text-base">{order.serviceTitle}</h4>

                      <p className="text-xs text-slate-400">
                        Client: <strong className="text-slate-200">{order.clientName}</strong> ({order.clientOrganization})
                      </p>

                      <div className="p-3 bg-slate-950/60 rounded-xl border border-slate-800/80 text-xs text-slate-300 mt-2">
                        <span className="font-semibold text-slate-400 block mb-0.5">Project Scope:</span>
                        {order.scopeDetails}
                      </div>

                      {order.deliverableNotes && (
                        <div className="text-xs text-emerald-400 bg-emerald-950/30 p-2.5 rounded-lg border border-emerald-800/40 mt-2">
                          <strong>Deliverable Submitted:</strong> {order.deliverableNotes}
                        </div>
                      )}
                    </div>

                    <div className="flex flex-col items-end gap-3 shrink-0 w-full md:w-auto">
                      <div className="text-right">
                        <p className="text-xs text-slate-400">Payment</p>
                        <p className="text-xl font-black text-emerald-400">₹{order.amount}</p>
                        <span className="text-[10px] text-slate-500">Verified Escrow</span>
                      </div>

                      <div className="flex items-center gap-2 w-full md:w-auto">
                        {isRequested && (
                          <button
                            onClick={() => handleAcceptOrder(order.id)}
                            className="w-full md:w-auto px-4 py-2 rounded-xl bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs cursor-pointer"
                          >
                            Accept Order
                          </button>
                        )}
                        {isInProgress && (
                          <button
                            onClick={() => setShowDeliverModal(order)}
                            className="w-full md:w-auto px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0B192C] font-bold text-xs flex items-center justify-center gap-1.5 cursor-pointer"
                          >
                            <Send className="w-3.5 h-3.5" />
                            Submit Deliverable
                          </button>
                        )}
                        {isSubmitted && (
                          <span className="text-xs text-cyan-400 font-semibold flex items-center gap-1">
                            <Clock className="w-3.5 h-3.5" />
                            Under Client Review
                          </span>
                        )}
                        {isCompleted && (
                          <span className="text-xs text-emerald-400 font-bold flex items-center gap-1">
                            <CheckCircle className="w-4 h-4" />
                            Completed & Paid
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Earnings */}
      {activeSubTab === 'earnings' && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400 font-medium">Verified Paid Earnings</p>
              <h3 className="text-3xl font-black text-emerald-400 mt-2">₹{totalEarnings.toLocaleString('en-IN')}</h3>
              <p className="text-xs text-slate-500 mt-2">Direct bank transfer eligible upon semester end</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400 font-medium">Successful Deliveries</p>
              <h3 className="text-3xl font-black text-white mt-2">{completedOrders.length}</h3>
              <p className="text-xs text-slate-500 mt-2">100% on-time completion rate</p>
            </div>
            <div className="bg-slate-900/70 border border-slate-800 rounded-2xl p-6">
              <p className="text-sm text-slate-400 font-medium">Student Freelancer Rating</p>
              <h3 className="text-3xl font-black text-amber-400 mt-2 flex items-center gap-1.5">
                <Star className="w-6 h-6 fill-current" />
                4.9 / 5.0
              </h3>
              <p className="text-xs text-slate-500 mt-2">Based on client & faculty reviews</p>
            </div>
          </div>

          <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
            <h4 className="font-bold text-white text-base mb-4">Completed Order Ledger</h4>
            {completedOrders.length === 0 ? (
              <p className="text-slate-500 text-sm">No completed orders yet.</p>
            ) : (
              <div className="divide-y divide-slate-800">
                {completedOrders.map(order => (
                  <div key={order.id} className="py-3 flex justify-between items-center text-sm">
                    <div>
                      <p className="font-semibold text-white">{order.serviceTitle}</p>
                      <p className="text-xs text-slate-400">Client: {order.clientName} ({order.clientOrganization})</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-emerald-400">+₹{order.amount}</p>
                      <p className="text-[11px] text-slate-500">{new Date(order.updatedAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Modal: Create Service */}
      {showCreateModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Create New Service Listing</h3>
            <p className="text-xs text-slate-400 mb-5">
              Offer your specialized engineering skills to clients and faculty mentors.
            </p>

            <form onSubmit={handleCreateService} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Service Title *</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. AutoCAD 2D Drafting & Component Modeling"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Description *</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Describe your deliverable, technical tools used, and what the client receives..."
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Price (₹ INR) *</label>
                  <input
                    type="number"
                    min={200}
                    step={50}
                    required
                    value={formData.price}
                    onChange={e => setFormData({ ...formData, price: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Delivery Time (Days)</label>
                  <input
                    type="number"
                    min={1}
                    max={30}
                    required
                    value={formData.deliveryDays}
                    onChange={e => setFormData({ ...formData, deliveryDays: Number(e.target.value) })}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Skills (Comma-separated)</label>
                <input
                  type="text"
                  placeholder="AutoCAD, Mechanical Modeling, SolidWorks, ISO Drafting"
                  value={formData.skillsInput}
                  onChange={e => setFormData({ ...formData, skillsInput: e.target.value })}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowCreateModal(false)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-[#0B192C] text-sm font-bold cursor-pointer"
                >
                  Publish Service
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Submit Deliverables */}
      {showDeliverModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0B192C] border border-slate-700 rounded-2xl w-full max-w-lg p-6 shadow-2xl">
            <h3 className="text-xl font-bold text-white mb-1">Submit Order Deliverable</h3>
            <p className="text-xs text-slate-400 mb-4">
              Order: <strong className="text-white">{showDeliverModal.orderNumber}</strong> • {showDeliverModal.serviceTitle}
            </p>

            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deliverable Summary & Notes *</label>
                <textarea
                  rows={4}
                  required
                  placeholder="Explain what has been completed, test verification results, and any instructions for the client..."
                  value={deliverableNotes}
                  onChange={e => setDeliverableNotes(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">Deliverable Files / Repository URL</label>
                <input
                  type="text"
                  placeholder="https://github.com/... or Google Drive / Zip link"
                  value={deliverableFileUrl}
                  onChange={e => setDeliverableFileUrl(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-sm text-white focus:outline-none focus:border-cyan-400"
                />
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-slate-800">
                <button
                  type="button"
                  onClick={() => setShowDeliverModal(null)}
                  className="px-4 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 text-sm font-semibold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={submittingDeliverable || !deliverableNotes}
                  onClick={handleSubmitDeliverable}
                  className="px-5 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 disabled:opacity-50 text-[#0B192C] text-sm font-bold cursor-pointer"
                >
                  {submittingDeliverable ? 'Submitting...' : 'Send for Client Review'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
