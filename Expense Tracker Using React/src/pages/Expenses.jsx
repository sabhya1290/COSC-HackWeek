// src/pages/Expenses.jsx
import { useState } from 'react';
import ExpenseTable from '../components/ExpenseTable';
import ExpenseForm from '../components/ExpenseForm';
import DeleteModal from '../components/DeleteModal';

export default function Expenses({ expenses, onAdd, onEdit, onDelete }) {
  const [formOpen,     setFormOpen]     = useState(false);
  const [editTarget,   setEditTarget]   = useState(null);
  const [deleteTarget, setDeleteTarget] = useState(null);

  const handleAdd = (data) => {
    onAdd(data);
    setFormOpen(false);
  };

  const handleEdit = (data) => {
    onEdit(editTarget.id, data);
    setEditTarget(null);
  };

  const handleDelete = () => {
    onDelete(deleteTarget.id);
    setDeleteTarget(null);
  };

  return (
    <div className="p-6">
      <ExpenseTable
        expenses={expenses}
        onAdd={() => setFormOpen(true)}
        onEdit={(e) => setEditTarget(e)}
        onDelete={(e) => setDeleteTarget(e)}
      />

      {formOpen && (
        <ExpenseForm
          onSubmit={handleAdd}
          onClose={() => setFormOpen(false)}
        />
      )}

      {editTarget && (
        <ExpenseForm
          initial={editTarget}
          onSubmit={handleEdit}
          onClose={() => setEditTarget(null)}
        />
      )}

      <DeleteModal
        expense={deleteTarget}
        onConfirm={handleDelete}
        onCancel={() => setDeleteTarget(null)}
      />
    </div>
  );
}
