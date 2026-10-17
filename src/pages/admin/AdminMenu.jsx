import { useEffect, useState } from 'react';
import { Plus, Save, Trash2, Eye, EyeOff, X } from 'lucide-react';
import { getAllMenu, updateMenuItem, createMenuItem, deleteMenuItem } from '../../services/menuService';
import MobileMenuModal from '../../components/mobile/MobileMenuModal';
import { useIsMobile } from '../../hooks/useIsMobile';

const EMPTY = {
  slug: '', name: '', category: 'kota', price: 20, image: '',
  desc: '', tag: '', tagClass: 'tag-special', ribbon: '',
  ingredients: [], popular: false, available: true, sortOrder: 100,
};

export default function AdminMenu() {
  const isMobile = useIsMobile();
  const [items, setItems] = useState([]);
  const [editing, setEditing] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const reload = async () => {
    const data = await getAllMenu();
    setItems(data);
    setLoading(false);
  };
  useEffect(() => { reload(); }, []);

  const startEdit = (item) => {
    setEditing({ ...item, ingredientsText: (item.ingredients || []).join(', ') });
    setError('');
  };
  const startNew = () => { setEditing({ ...EMPTY, ingredientsText: '' }); setError(''); };
  const cancelEdit = () => setEditing(null);

  const saveEdit = async () => {
    setSaving(true); setError('');
    try {
      const payload = {
        ...editing,
        price: Number(editing.price) || 0,
        sortOrder: Number(editing.sortOrder) || 0,
        ingredients: (editing.ingredientsText || '').split(',').map((s) => s.trim()).filter(Boolean),
      };
      delete payload.ingredientsText;
      if (editing.id) await updateMenuItem(editing.id, payload);
      else await createMenuItem(payload);
      await reload(); setEditing(null);
    } catch (e) {
      setError(e.message || 'Failed to save');
    } finally {
      setSaving(false);
    }
  };

  const toggleAvailable = async (item) => {
    await updateMenuItem(item.id, { ...item, available: !item.available });
    reload();
  };

  const remove = async (item) => {
    if (!confirm(`Delete "${item.name}"?`)) return;
    await deleteMenuItem(item.id);
    reload();
  };

  return (
    <div className="admin-page">
      <header className="admin-page-head">
        <div>
          <div className="admin-page-eyebrow">Manage</div>
          <h1 className="admin-page-title">Menu</h1>
        </div>
        <button className="admin-btn-primary" onClick={startNew}>
          <Plus size={16} /> Add item
        </button>
      </header>

      {loading ? (
        <div className="admin-loading-inline">Loading menuâ€¦</div>
      ) : (
        <div className="admin-table">
          <div className="admin-table-head">
            <div>Item</div><div>Category</div><div>Price</div><div>Status</div><div></div>
          </div>
          {items.map((item) => (
            <div key={item.id} className="admin-table-row">
              <div>
                <div className="admin-menu-name">{item.name}</div>
                <div className="admin-menu-slug">{item.slug}</div>
              </div>
              <div className="admin-menu-category">{item.category}</div>
              <div className="admin-menu-price">R {item.price.toFixed(2)}</div>
              <div>
                <span className={`admin-pill ${item.available ? 'on' : 'off'}`}>
                  {item.available ? 'Available' : 'Sold out'}
                </span>
              </div>
              <div className="admin-table-actions">
                <button onClick={() => toggleAvailable(item)} title="Toggle availability">
                  {item.available ? <Eye size={15} /> : <EyeOff size={15} />}
                </button>
                <button onClick={() => startEdit(item)} className="admin-btn-edit">Edit</button>
                <button onClick={() => remove(item)} className="admin-btn-danger">
                  <Trash2 size={15} />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {editing && isMobile && (
        <MobileMenuModal 
          item={editing} 
          onClose={cancelEdit} 
          onSave={async (form) => {
            const payload = { ...form, price: Number(form.price) };
            if (editing.id) await updateMenuItem(editing.id, payload);
            else await createMenuItem(payload);
            await reload();
            setEditing(null);
          }} 
        />
      )}

      {editing && !isMobile && (
        <div className="admin-modal-overlay" onClick={cancelEdit}>
          <div className="admin-modal admin-modal-wide" onClick={(e) => e.stopPropagation()}>
            <div className="admin-modal-head">
              <div>
                <div className="admin-page-eyebrow">{editing.id ? 'Edit item' : 'New item'}</div>
                <h2 className="admin-modal-title">{editing.name || 'Untitled item'}</h2>
              </div>
              <button className="admin-modal-close" onClick={cancelEdit}><X size={18} /></button>
            </div>

            <div className="admin-modal-body">
              {/* BASICS */}
              <section className="admin-form-section">
                <div className="admin-form-section-head">
                  <div className="admin-form-section-title">Basics</div>
                  <div className="admin-form-section-sub">The name customers see and how it's grouped.</div>
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span className="admin-field-label">Name</span>
                    <input
                      value={editing.name}
                      onChange={(e) => setEditing({
                        ...editing,
                        name: e.target.value,
                        slug: editing.slug || e.target.value.toLowerCase().replace(/[^a-z0-9]+/g, '-'),
                      })}
                      placeholder="e.g. Emporium Bliss"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Slug (URL)</span>
                    <input
                      value={editing.slug}
                      onChange={(e) => setEditing({ ...editing, slug: e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, '-') })}
                      placeholder="emporium-bliss"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Category</span>
                    <select
                      value={editing.category}
                      onChange={(e) => setEditing({ ...editing, category: e.target.value })}
                    >
                      <option value="kota">Kota</option>
                      <option value="drink">Drink</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Price (R)</span>
                    <input
                      type="number" min="0" step="0.5"
                      value={editing.price}
                      onChange={(e) => setEditing({ ...editing, price: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              {/* IMAGE */}
              <section className="admin-form-section">
                <div className="admin-form-section-head">
                  <div className="admin-form-section-title">Image</div>
                  <div className="admin-form-section-sub">Drag a photo in, or click to browse.</div>
                </div>
                <ImageUploader
                  value={editing.image}
                  onChange={(url) => setEditing({ ...editing, image: url })}
                  folder="menu"
                />
              </section>

              {/* CONTENT */}
              <section className="admin-form-section">
                <div className="admin-form-section-head">
                  <div className="admin-form-section-title">Content</div>
                  <div className="admin-form-section-sub">What the customer reads before ordering.</div>
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field admin-field-full">
                    <span className="admin-field-label">Description</span>
                    <textarea
                      rows={3}
                      value={editing.desc || ''}
                      onChange={(e) => setEditing({ ...editing, desc: e.target.value })}
                      placeholder="A short, appetising description."
                    />
                  </label>
                  <label className="admin-field admin-field-full">
                    <span className="admin-field-label">Ingredients (comma-separated)</span>
                    <input
                      value={editing.ingredientsText || ''}
                      onChange={(e) => setEditing({ ...editing, ingredientsText: e.target.value })}
                      placeholder="Chips, Cheese, Achaar, Polony"
                    />
                  </label>
                </div>
              </section>

              {/* PRESENTATION */}
              <section className="admin-form-section">
                <div className="admin-form-section-head">
                  <div className="admin-form-section-title">Presentation</div>
                  <div className="admin-form-section-sub">How the item is highlighted on the card.</div>
                </div>
                <div className="admin-form-grid">
                  <label className="admin-field">
                    <span className="admin-field-label">Tag</span>
                    <input
                      value={editing.tag || ''}
                      onChange={(e) => setEditing({ ...editing, tag: e.target.value })}
                      placeholder="House Special"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Tag colour</span>
                    <select
                      value={editing.tagClass || ''}
                      onChange={(e) => setEditing({ ...editing, tagClass: e.target.value })}
                    >
                      <option value="tag-special">Special (red)</option>
                      <option value="tag-fav">Favourite (green)</option>
                      <option value="tag-beast">Beast (gold)</option>
                    </select>
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Ribbon</span>
                    <input
                      value={editing.ribbon || ''}
                      onChange={(e) => setEditing({ ...editing, ribbon: e.target.value })}
                      placeholder="Best Value"
                    />
                  </label>
                  <label className="admin-field">
                    <span className="admin-field-label">Sort order</span>
                    <input
                      type="number"
                      value={editing.sortOrder || 0}
                      onChange={(e) => setEditing({ ...editing, sortOrder: e.target.value })}
                    />
                  </label>
                </div>
              </section>

              {/* OPTIONS */}
              <section className="admin-form-section admin-form-section-last">
                <div className="admin-form-section-head">
                  <div className="admin-form-section-title">Options</div>
                </div>
                <div className="admin-form-toggles">
                  <label className="admin-check">
                    <input
                      type="checkbox"
                      checked={!!editing.popular}
                      onChange={(e) => setEditing({ ...editing, popular: e.target.checked })}
                    />
                    <span>Mark as popular (shows a badge)</span>
                  </label>
                  <label className="admin-check">
                    <input
                      type="checkbox"
                      checked={editing.available !== false}
                      onChange={(e) => setEditing({ ...editing, available: e.target.checked })}
                    />
                    <span>Available for ordering</span>
                  </label>
                </div>
              </section>

              {error && <div className="admin-login-error">{error}</div>}
            </div>

            <div className="admin-modal-foot">
              <button className="admin-btn-ghost" onClick={cancelEdit}>Cancel</button>
              <button className="admin-btn-primary" onClick={saveEdit} disabled={saving}>
                <Save size={15} /> {saving ? 'Savingâ€¦' : 'Save item'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}