'use client';

import { useState, useMemo } from 'react';
import {
  DndContext,
  DragOverlay,
  closestCorners,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import {
  SortableContext,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { adminAPI } from '@/utils/api';
import { formatPrice } from '@/utils/helpers';
import toast from 'react-hot-toast';
import {
  FiClock, FiCheck, FiTruck, FiPackage, FiXCircle,
  FiCreditCard, FiAlertTriangle,
} from 'react-icons/fi';

const COLUMNS = [
  { id: 'confirmed', label: 'Confirmed', icon: FiCheck, color: 'border-blue-400 bg-blue-50/50', badge: 'bg-blue-100 text-blue-800', dot: 'bg-blue-500' },
  { id: 'processing', label: 'Processing', icon: FiClock, color: 'border-indigo-400 bg-indigo-50/50', badge: 'bg-indigo-100 text-indigo-800', dot: 'bg-indigo-500' },
  { id: 'shipped', label: 'Shipped', icon: FiTruck, color: 'border-purple-400 bg-purple-50/50', badge: 'bg-purple-100 text-purple-800', dot: 'bg-purple-500' },
  { id: 'delivered', label: 'Delivered', icon: FiPackage, color: 'border-emerald-400 bg-emerald-50/50', badge: 'bg-emerald-100 text-emerald-800', dot: 'bg-emerald-500' },
  { id: 'cancelled', label: 'Cancelled', icon: FiXCircle, color: 'border-red-400 bg-red-50/50', badge: 'bg-red-100 text-red-800', dot: 'bg-red-500' },
];

/* ── Draggable Order Card ───────────────────────────────── */
function OrderCard({ order, onClick, isDragging }) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging: isSortDragging,
  } = useSortable({ id: order._id, data: { order, status: order.status } });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isSortDragging ? 0.4 : 1,
  };

  const ageHours = order.ageInHours || 0;
  const ageColor = ageHours < 2 ? 'text-emerald-600' : ageHours < 12 ? 'text-amber-600' : 'text-red-600';

  return (
    <div
      ref={setNodeRef}
      style={style}
      {...attributes}
      {...listeners}
      onClick={(e) => { e.stopPropagation(); onClick?.(order); }}
      className={`bg-white rounded-lg border border-gray-200 p-3 cursor-grab active:cursor-grabbing hover:shadow-md transition-shadow select-none ${isDragging ? 'shadow-xl ring-2 ring-gray-900/10' : ''}`}
    >
      <div className="flex items-start justify-between mb-2">
        <span className="text-xs font-mono text-gray-500 truncate">{order.displayOrderId || `#${order.orderId?.slice(-8) || order._id?.slice(-6)}`}</span>
        <span className={`text-[10px] font-semibold ${ageColor}`}>{ageHours > 0 ? `${Math.round(ageHours)}h ago` : 'Just now'}</span>
      </div>
      <p className="text-sm font-medium text-gray-900 truncate mb-1">
        {order.shippingAddress?.fullName || order.customerName || 'Customer'}
      </p>
      <div className="flex items-center justify-between">
        <span className="text-sm font-bold text-gray-900">{formatPrice(order.total || order.totalAmount || 0)}</span>
        <span className={`text-[10px] font-semibold uppercase px-1.5 py-0.5 rounded ${
          order.payment?.method === 'cod' || order.paymentMethod === 'cod'
            ? 'bg-amber-50 text-amber-700' : 'bg-emerald-50 text-emerald-700'
        }`}>
          {order.payment?.method === 'cod' || order.paymentMethod === 'cod' ? 'COD' : 'Paid'}
        </span>
      </div>
      {/* Risk badge */}
      {order.riskAnalysis?.hasRisks && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-amber-600 font-medium">
          <FiAlertTriangle className="w-3 h-3" /> Risk flagged
        </div>
      )}
      {/* Items preview */}
      <div className="mt-2 text-xs text-gray-400">{order.items?.length || 0} item{(order.items?.length || 0) !== 1 ? 's' : ''}</div>
    </div>
  );
}

/* ── Overlay Card (while dragging) ──────────────────────── */
function OverlayCard({ order }) {
  return (
    <div className="bg-white rounded-lg border-2 border-gray-900/20 p-3 shadow-2xl w-64 rotate-2">
      <span className="text-xs font-mono text-gray-500">{order.displayOrderId || `#${order.orderId?.slice(-8)}`}</span>
      <p className="text-sm font-medium text-gray-900 truncate mt-1">{order.shippingAddress?.fullName || order.customerName}</p>
      <span className="text-sm font-bold text-gray-900">{formatPrice(order.total || 0)}</span>
    </div>
  );
}

/* ── Kanban Column ──────────────────────────────────────── */
function KanbanColumn({ column, orders, onCardClick }) {
  const Icon = column.icon;
  return (
    <div className={`flex flex-col rounded-xl border-t-4 ${column.color} min-w-[240px] w-full`}>
      <div className="px-3 py-2.5 flex items-center gap-2 border-b border-gray-100">
        <Icon className="w-4 h-4 text-gray-500" />
        <span className="text-sm font-semibold text-gray-800">{column.label}</span>
        <span className={`ml-auto text-[11px] font-bold px-2 py-0.5 rounded-full ${column.badge}`}>{orders.length}</span>
      </div>
      <div className="flex-1 overflow-y-auto p-2 space-y-2 min-h-[200px] max-h-[calc(100vh-280px)]">
        <SortableContext items={orders.map(o => o._id)} strategy={verticalListSortingStrategy}>
          {orders.map(order => (
            <OrderCard key={order._id} order={order} onClick={onCardClick} />
          ))}
        </SortableContext>
        {orders.length === 0 && (
          <div className="flex items-center justify-center h-24 text-xs text-gray-400">No orders</div>
        )}
      </div>
    </div>
  );
}

/* ── Main Kanban Board ──────────────────────────────────── */
export default function OrderKanbanBoard({ orders, onRefresh, onCardClick }) {
  const [activeOrder, setActiveOrder] = useState(null);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  // Group orders by status
  const grouped = useMemo(() => {
    const map = {};
    COLUMNS.forEach(c => { map[c.id] = []; });
    (orders || []).forEach(o => {
      const status = o.status || 'confirmed';
      if (map[status]) map[status].push(o);
      else map.confirmed.push(o); // fallback
    });
    return map;
  }, [orders]);

  const handleDragStart = (event) => {
    const order = orders.find(o => o._id === event.active.id);
    setActiveOrder(order || null);
  };

  const handleDragEnd = async (event) => {
    setActiveOrder(null);
    const { active, over } = event;
    if (!over) return;

    const draggedOrder = orders.find(o => o._id === active.id);
    if (!draggedOrder) return;

    // Determine target column — either dropped on a card (get that card's status) or on the column droppable
    let targetStatus = null;

    // Check if over is an order card
    const overOrder = orders.find(o => o._id === over.id);
    if (overOrder) {
      targetStatus = overOrder.status;
    } else {
      // over.id is the column id
      targetStatus = over.id;
    }

    if (!targetStatus || targetStatus === draggedOrder.status) return;

    // Validate transition
    const validTransitions = {
      confirmed: ['processing', 'cancelled'],
      processing: ['shipped', 'cancelled'],
      shipped: ['delivered'],
      delivered: [],
      cancelled: [],
    };

    if (!validTransitions[draggedOrder.status]?.includes(targetStatus)) {
      toast.error(`Cannot move from ${draggedOrder.status} to ${targetStatus}`);
      return;
    }

    try {
      await adminAPI.updateOrderStatus(draggedOrder._id, targetStatus);
      toast.success(`Order moved to ${targetStatus}`);
      onRefresh?.();
    } catch (err) {
      toast.error(err.response?.data?.message || 'Failed to update status');
    }
  };

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCorners}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
    >
      <div className="flex gap-3 overflow-x-auto pb-4">
        {COLUMNS.map(col => (
          <KanbanColumn
            key={col.id}
            column={col}
            orders={grouped[col.id] || []}
            onCardClick={onCardClick}
          />
        ))}
      </div>
      <DragOverlay>
        {activeOrder ? <OverlayCard order={activeOrder} /> : null}
      </DragOverlay>
    </DndContext>
  );
}
