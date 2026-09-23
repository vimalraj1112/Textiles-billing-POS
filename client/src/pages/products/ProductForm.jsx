import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import { Plus, Trash2 } from 'lucide-react';
import { productApi, masterApi, uploadApi } from '../../api';
import PageHeader from '../../components/PageHeader';
import Input from '../../components/Input';
import Select from '../../components/Select';
import Button from '../../components/Button';
import { Skeleton } from '../../components/Loading';
import { GENDERS, MATERIALS } from '../../constants/masters';

function emptyVariant() {
  return { size: '', color: '', sku: '', barcode: '', purchasePrice: '', sellingPrice: '', stock: 0, minimumStock: '' };
}

export default function ProductForm() {
  const { id } = useParams();
  const isEdit = !!id;
  const navigate = useNavigate();
  const qc = useQueryClient();

  const { data: cats } = useQuery({ queryKey: ['categories', 'all'], queryFn: () => masterApi.list('categories', { limit: 100 }).then((r) => r.data.data) });
  const { data: brands } = useQuery({ queryKey: ['brands', 'all'], queryFn: () => masterApi.list('brands', { limit: 100 }).then((r) => r.data.data) });
  const { data: sizes } = useQuery({ queryKey: ['sizes', 'all'], queryFn: () => masterApi.list('sizes', { limit: 100 }).then((r) => r.data.data) });
  const { data: colors } = useQuery({ queryKey: ['colors', 'all'], queryFn: () => masterApi.list('colors', { limit: 100 }).then((r) => r.data.data) });
  const { data: supplierData } = useQuery({ queryKey: ['suppliers', 'all'], queryFn: () => masterApi.list('suppliers', { limit: 100 }).then((r) => r.data.data) });

  const { data: existing, isLoading: loadingExisting } = useQuery({
    queryKey: ['product', id],
    queryFn: () => productApi.get(id).then((r) => r.data.data),
    enabled: isEdit,
  });

  const [form, setForm] = useState({
    name: '',
    sku: '',
    category: '',
    subcategory: '',
    brand: '',
    description: '',
    material: '',
    gender: '',
    taxRate: 0,
    supplier: '',
    purchasePrice: '',
    sellingPrice: '',
    discount: 0,
    minimumStock: 0,
    status: 'ACTIVE',
  });
  const [variants, setVariants] = useState([]);
  const [images, setImages] = useState([]);
  const [uploading, setUploading] = useState(false);

  useEffect(() => {
    if (existing) {
      setForm({
        name: existing.name,
        sku: existing.sku || '',
        category: existing.category?._id || existing.category || '',
        subcategory: existing.subcategory || '',
        brand: existing.brand?._id || existing.brand || '',
        description: existing.description || '',
        material: existing.material || '',
        gender: existing.gender || '',
        taxRate: existing.taxRate || 0,
        supplier: existing.supplier?._id || existing.supplier || '',
        purchasePrice: existing.purchasePrice / 100 || '',
        sellingPrice: existing.sellingPrice / 100 || '',
        discount: existing.discount || 0,
        minimumStock: existing.minimumStock || 0,
        status: existing.status || 'ACTIVE',
      });
      setVariants(
        existing.variants.map((v) => ({
          _id: v._id,
          size: v.size?._id || v.size || '',
          color: v.color?._id || v.color || '',
          sku: v.sku || '',
          barcode: v.barcode || '',
          purchasePrice: (v.purchasePrice || 0) / 100,
          sellingPrice: (v.sellingPrice || 0) / 100,
          stock: v.stock || 0,
          minimumStock: (v.minimumStock || 0),
        }))
      );
      setImages(existing.images || []);
    }
  }, [existing]);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  const handleImageUpload = async (files) => {
    if (!files?.length) return;
    setUploading(true);
    try {
      const res = await uploadApi.upload(files);
      setImages((imgs) => [...imgs, ...res.data.data]);
      toast.success('Image uploaded');
    } catch (e) {
      toast.error('Upload failed');
    } finally {
      setUploading(false);
    }
  };

  const saveMutation = useMutation({
    mutationFn: (payload) => (isEdit ? productApi.update(id, payload) : productApi.create(payload)),
    onSuccess: (res) => {
      toast.success(isEdit ? 'Product updated' : 'Product created');
      qc.invalidateQueries(['products']);
      navigate(`/products/${res.data.data._id}`);
    },
    onError: (e) => toast.error(e.response?.data?.message || 'Could not save product'),
  });

  const onSubmit = (e) => {
    e.preventDefault();
    if (!form.name.trim()) return toast.error('Product name is required');
    if (!form.sellingPrice) return toast.error('Selling price is required');

    const payload = {
      name: form.name,
      sku: form.sku || undefined,
      category: form.category || null,
      subcategory: form.subcategory || undefined,
      brand: form.brand || null,
      description: form.description || undefined,
      material: form.material || undefined,
      gender: form.gender || undefined,
      taxRate: Number(form.taxRate) || 0,
      supplier: form.supplier || null,
      purchasePrice: Number(form.purchasePrice || 0),
      sellingPrice: Number(form.sellingPrice),
      discount: Number(form.discount) || 0,
      minimumStock: Number(form.minimumStock) || 0,
      status: form.status,
      images,
      variants:
        variants.length > 0
          ? variants
              .filter((v) => v.size || v.color || v.sku || v.sellingPrice)
              .map((v) => ({
                ...(v._id ? { _id: v._id } : {}),
                size: v.size || null,
                color: v.color || null,
                sku: v.sku || undefined,
                barcode: v.barcode || undefined,
                purchasePrice: Number(v.purchasePrice || 0),
                sellingPrice: Number(v.sellingPrice || 0),
                stock: Number(v.stock || 0),
                minimumStock: Number(v.minimumStock || 0),
              }))
          : undefined,
    };
    saveMutation.mutate(payload);
  };

  if (isEdit && loadingExisting) return <Skeleton rows={10} />;

  return (
    <div>
      <PageHeader title={isEdit ? 'Edit Product' : 'New Product'} subtitle={isEdit ? `Updating ${existing?.name}` : 'Add a new item to your catalogue'}
        actions={<Button variant="secondary" onClick={() => navigate(-1)}>Back</Button>} />
      <form onSubmit={onSubmit} className="space-y-5">
        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Basic Details</h3>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <Input label="Product Name *" value={form.name} onChange={(e) => set('name', e.target.value)} />
            <Input label="SKU" value={form.sku} onChange={(e) => set('sku', e.target.value)} placeholder="Auto-generated variants also supported" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Purchase ₹" type="number" min="0" step="0.01" value={form.purchasePrice} onChange={(e) => set('purchasePrice', e.target.value)} />
              <Input label="Selling ₹ *" type="number" min="0" step="0.01" value={form.sellingPrice} onChange={(e) => set('sellingPrice', e.target.value)} />
            </div>
            <Select label="Category" value={form.category} onChange={(e) => set('category', e.target.value)}>
              <option value="">None</option>
              {cats?.items?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}
            </Select>
            <Select label="Brand" value={form.brand} onChange={(e) => set('brand', e.target.value)}>
              <option value="">None</option>
              {brands?.items?.map((b) => <option key={b._id} value={b._id}>{b.name}</option>)}
            </Select>
            <Select label="Supplier" value={form.supplier} onChange={(e) => set('supplier', e.target.value)}>
              <option value="">None</option>
              {supplierData?.items?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}
            </Select>
            <Input label="Subcategory" value={form.subcategory} onChange={(e) => set('subcategory', e.target.value)} />
            <Select label="Material" value={form.material} onChange={(e) => set('material', e.target.value)}>
              <option value="">None</option>
              {MATERIALS.map((m) => <option key={m} value={m}>{m}</option>)}
            </Select>
            <Select label="Gender" value={form.gender} onChange={(e) => set('gender', e.target.value)}>
              <option value="">None</option>
              {GENDERS.map((g) => <option key={g} value={g}>{g}</option>)}
            </Select>
            <div className="grid grid-cols-3 gap-3">
              <Input label="Tax %" type="number" min="0" max="100" value={form.taxRate} onChange={(e) => set('taxRate', e.target.value)} />
              <Input label="Discount" type="number" min="0" value={form.discount} onChange={(e) => set('discount', e.target.value)} />
              <Input label="Min Stock" type="number" min="0" value={form.minimumStock} onChange={(e) => set('minimumStock', e.target.value)} />
            </div>
            <div className="md:col-span-2 lg:col-span-3">
              <label className="mb-1 block text-xs font-medium text-slate-600">Description</label>
              <textarea className="input-base" rows="2" value={form.description} onChange={(e) => set('description', e.target.value)} />
            </div>
            <Select label="Status" value={form.status} onChange={(e) => set('status', e.target.value)}>
              <option value="ACTIVE">Active</option>
              <option value="INACTIVE">Inactive</option>
            </Select>
          </div>
        </div>

        <div className="card p-5">
          <h3 className="mb-4 text-sm font-semibold text-slate-700">Images</h3>
          <div className="flex flex-wrap items-center gap-3">
            {images.map((img, i) => (
              <div key={i} className="relative">
                <img src={img.startsWith('http') ? img : `/uploads/${img.replace('/uploads/', '')}`} alt="" className="h-16 w-16 rounded-lg object-cover" />
                <button type="button" onClick={() => setImages(images.filter((_, idx) => idx !== i))} className="absolute -right-1.5 -top-1.5 rounded-full bg-red-500 p-0.5 text-white"><Trash2 className="h-3 w-3" /></button>
              </div>
            ))}
            <label className="cursor-pointer rounded-lg border border-dashed border-slate-300 px-4 py-4 text-sm text-slate-400 hover:border-blue-400 hover:text-blue-500">
              {uploading ? 'Uploading...' : '+ Upload'}
              <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => handleImageUpload(e.target.files)} />
            </label>
          </div>
        </div>

        <div className="card p-5">
          <div className="mb-4 flex items-center justify-between">
            <div>
              <h3 className="text-sm font-semibold text-slate-700">Variants (Size / Color)</h3>
              <p className="text-xs text-slate-400">Each variant keeps its own stock, barcode and price. Leave empty to use product defaults.</p>
            </div>
            <Button type="button" variant="secondary" size="sm" onClick={() => setVariants([...variants, emptyVariant()])}><Plus className="h-4 w-4" /> Add Variant</Button>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="text-left text-xs text-slate-500">
                  <th className="py-2 pr-2">Size</th><th className="py-2 pr-2">Color</th><th className="py-2 pr-2">SKU</th><th className="py-2 pr-2">Barcode</th>
                  <th className="py-2 pr-2">Purchase ₹</th><th className="py-2 pr-2">Selling ₹</th><th className="py-2 pr-2">Stock</th><th className="py-2 pr-2">Min</th><th></th>
                </tr>
              </thead>
              <tbody>
                {variants.length === 0 && (
                  <tr><td colSpan="9" className="py-6 text-center text-xs text-slate-400">No variants. A default variant will be created automatically.</td></tr>
                )}
                {variants.map((v, i) => (
                  <tr key={i}>
                    <td className="py-2 pr-2"><Select value={v.size} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, size: e.target.value } : x))}><option value="">Any</option>{sizes?.items?.map((s) => <option key={s._id} value={s._id}>{s.name}</option>)}</Select></td>
                    <td className="py-2 pr-2"><Select value={v.color} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, color: e.target.value } : x))}><option value="">Any</option>{colors?.items?.map((c) => <option key={c._id} value={c._id}>{c.name}</option>)}</Select></td>
                    <td className="py-2 pr-2"><input className="input-base" value={v.sku} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, sku: e.target.value } : x))} /></td>
                    <td className="py-2 pr-2"><input className="input-base" value={v.barcode} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, barcode: e.target.value } : x))} /></td>
                    <td className="py-2 pr-2"><input className="input-base" type="number" min="0" step="0.01" value={v.purchasePrice} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, purchasePrice: e.target.value } : x))} /></td>
                    <td className="py-2 pr-2"><input className="input-base" type="number" min="0" step="0.01" value={v.sellingPrice} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, sellingPrice: e.target.value } : x))} /></td>
                    <td className="py-2 pr-2"><input className="input-base" type="number" min="0" value={v.stock} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, stock: e.target.value } : x))} /></td>
                    <td className="py-2 pr-2"><input className="input-base" type="number" min="0" value={v.minimumStock} onChange={(e) => setVariants(variants.map((x, idx) => idx === i ? { ...x, minimumStock: e.target.value } : x))} /></td>
                    <td className="py-2"><button type="button" onClick={() => setVariants(variants.filter((_, idx) => idx !== i))} className="text-red-400 hover:text-red-600"><Trash2 className="h-4 w-4" /></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="flex justify-end gap-2 pb-6">
          <Button type="button" variant="secondary" onClick={() => navigate(-1)}>Cancel</Button>
          <Button type="submit" loading={saveMutation.isLoading}>{isEdit ? 'Save Changes' : 'Create Product'}</Button>
        </div>
      </form>
    </div>
  );
}