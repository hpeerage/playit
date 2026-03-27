import React, { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase';
import { Package, Plus, Trash2, Check, X, Loader2, DollarSign, Upload } from 'lucide-react';
import { cn } from '../../lib/utils';

const EMOJI_CATEGORIES = {
  meal: ['🍜', '🍚', '🍛', '🍱', '🍲', '🍖', '🍗', '🍔', '🍕', '🍟', '🥪', '🌮', '🥟', '🍤', '🍣', '🍢'],
  drink: ['☕', '🍵', '🥤', '🧋', '🥛', '🍺', '🍹', '🍷', '🍶', '🧉', '🧊', '🍶', '🥂', '🍾', '🥃', '🍹'],
  snack: ['🍿', '🥨', '🍪', '🍩', '🍰', '🧁', '🥧', '🍫', '🍬', '🍭', '🍮', '🍦', '🍧', '🍨', '🧇', '🥞'],
  special: ['🍳', '🥖', '🥐', '🥯', '🍴', '🥄', '🥢', '🥘', '🍳', '🥗', '🍓', '🍇', '🍉', '🍌', '🍋', '🍎']
};

interface Product {
  id: string;
  name: string;
  category: string;
  price: number;
  image_url: string;
  is_available: boolean;
  stock: number;
}

const ProductManagementView = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAdding, setIsAdding] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'meal',
    price: 0,
    image_url: '🍜', // Default to emoji or URL
    is_available: true,
    stock: -1
  });

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 파일 타입 체크
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 파일 크기 체크 (2MB 제한)
    if (file.size > 2 * 1024 * 1024) {
      alert('파일 크기는 2MB를 초과할 수 없습니다.');
      return;
    }

    setIsUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${Math.random().toString(36).substring(2)}-${Date.now()}.${fileExt}`;
      const filePath = `products/${fileName}`;

      const { error: uploadError } = await supabase.storage
        .from('product-images')
        .upload(filePath, file);

      if (uploadError) throw uploadError;

      // 공용 URL 가져오기
      const { data: { publicUrl } } = supabase.storage
        .from('product-images')
        .getPublicUrl(filePath);

      setNewProduct(prev => ({ ...prev, image_url: publicUrl }));
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('이미지 업로드 중 오류가 발생했습니다: ' + error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const fetchProducts = async () => {
    setLoading(true);
    const { data } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false });
    
    if (data) setProducts(data);
    setLoading(false);
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    const { error: insertError } = await supabase.from('products').insert([newProduct]);
    if (insertError) {
      console.error('Error adding product:', insertError);
      alert('상품 등록 중 오류가 발생했습니다.');
      return;
    }
    setIsAdding(false);
    setNewProduct({ name: '', category: 'meal', price: 0, image_url: '🍜', is_available: true, stock: -1 });
    fetchProducts();
  };

  const toggleAvailability = async (id: string, currentStatus: boolean) => {
    const { error } = await supabase
      .from('products')
      .update({ is_available: !currentStatus })
      .eq('id', id);
    if (!error) fetchProducts();
  };

  const deleteProduct = async (id: string) => {
    if (!confirm('정말 이 상품을 삭제하시겠습니까?')) return;
    const { error } = await supabase.from('products').delete().eq('id', id);
    if (error) {
      console.error('Error deleting product:', error);
      alert('상품 삭제 중 오류가 발생했습니다: ' + error.message);
    } else {
      fetchProducts();
    }
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden relative p-10">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h2 className="text-[12px] font-black uppercase tracking-[0.4em] text-slate-500 mb-1">Stock & Menu Management</h2>
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-purple-500/20 flex items-center justify-center border border-purple-500/30">
                <Package className="w-4 h-4 text-purple-400" />
             </div>
             <span className="text-2xl font-black italic text-white leading-none uppercase tracking-tighter">Inventory Control</span>
             <div className="h-4 w-px bg-white/10" />
             <span className="text-purple-400 text-[11px] font-bold uppercase tracking-widest">{products.length} Items Registered</span>
          </div>
        </div>

        <button 
          onClick={() => setIsAdding(true)}
          className="flex items-center gap-2 px-6 py-3 bg-purple-600 hover:bg-purple-500 text-white rounded-2xl text-[11px] font-black uppercase tracking-widest transition-all shadow-[0_10px_30px_rgba(139,92,246,0.3)] shadow-purple-900/20"
        >
          <Plus className="w-4 h-4" /> Add New Product
        </button>
      </div>

      {loading ? (
        <div className="flex-1 flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-purple-500 animate-spin" />
        </div>
      ) : (
        <div className="flex-1 overflow-y-auto custom-scrollbar pr-2">
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {products.map((product) => (
              <div key={product.id} className="bg-slate-900/40 border border-white/5 p-6 rounded-[32px] flex items-center gap-6 group hover:border-purple-500/30 transition-all duration-500">
                <div className="w-20 h-20 rounded-2xl bg-slate-800 flex items-center justify-center text-4xl border border-white/10 group-hover:scale-110 transition-transform duration-500 overflow-hidden shrink-0">
                  {product.image_url?.startsWith('http') ? (
                    <img src={product.image_url} alt={product.name} className="w-full h-full object-cover" />
                  ) : (
                    <span>{product.image_url}</span>
                  )}
                </div>
                
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-[10px] font-black uppercase tracking-widest text-purple-400 px-2 py-0.5 bg-purple-500/10 rounded-md">
                      {product.category}
                    </span>
                    {!product.is_available && (
                      <span className="text-[10px] font-black uppercase tracking-widest text-red-400 px-2 py-0.5 bg-red-500/10 rounded-md">
                        Sold Out
                      </span>
                    )}
                  </div>
                  <h3 className="text-lg font-black text-white uppercase truncate">{product.name}</h3>
                  <p className="text-slate-500 text-[11px] font-bold uppercase tracking-widest mt-1">
                    {product.price.toLocaleString()} KRW
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button 
                    onClick={() => toggleAvailability(product.id, product.is_available)}
                    className={cn(
                      "w-10 h-10 rounded-xl flex items-center justify-center border transition-all",
                      product.is_available 
                        ? "bg-emerald-500/10 border-emerald-500/20 text-emerald-400 hover:bg-emerald-500 hover:text-white" 
                        : "bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500 hover:text-white"
                    )}
                    title={product.is_available ? "Set as Sold Out" : "Set as Available"}
                  >
                    {product.is_available ? <Check className="w-4 h-4" /> : <X className="w-4 h-4" />}
                  </button>
                  <button 
                    onClick={() => deleteProduct(product.id)}
                    className="w-10 h-10 rounded-xl bg-slate-800 border border-white/5 text-slate-500 hover:bg-red-500 hover:text-white hover:border-red-500/50 flex items-center justify-center transition-all"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[4000] flex items-center justify-center p-6">
          <div className="absolute inset-0 bg-slate-950/80 backdrop-blur-md" onClick={() => setIsAdding(false)} />
          <form 
            onSubmit={handleAddProduct}
            className="relative w-full max-w-lg bg-slate-900 border border-white/10 rounded-[40px] p-10 shadow-2xl animate-in zoom-in-95 duration-300"
          >
            <h3 className="text-2xl font-black italic text-white uppercase tracking-tighter mb-8">Register New Product</h3>
            
            <div className="space-y-6">
              <div>
                <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Product Name</label>
                <input 
                  autoFocus
                  required
                  type="text"
                  value={newProduct.name}
                  onChange={e => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl px-6 text-white font-bold focus:outline-none focus:border-purple-500 transition-all"
                  placeholder="e.g., Premium PC Ramen"
                />
              </div>

              <div className="grid grid-cols-2 gap-6">
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Category</label>
                  <select 
                    value={newProduct.category}
                    onChange={e => setNewProduct({...newProduct, category: e.target.value})}
                    className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl px-6 text-white font-bold focus:outline-none focus:border-purple-500 transition-all appearance-none"
                  >
                    <option value="meal">Meal</option>
                    <option value="drink">Drink</option>
                    <option value="snack">Snack</option>
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 mb-2 block">Price (KRW)</label>
                  <div className="relative">
                    <input 
                      required
                      type="number"
                      value={newProduct.price || ''}
                      onChange={e => setNewProduct({...newProduct, price: parseInt(e.target.value)})}
                      className="w-full h-14 bg-slate-800/50 border border-white/5 rounded-2xl px-6 text-white font-bold focus:outline-none focus:border-purple-500 transition-all"
                      placeholder="0"
                    />
                    <DollarSign className="absolute right-6 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                  </div>
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="text-[10px] font-black uppercase tracking-widest text-slate-500 block">Choose Icon or Upload Image</label>
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    className="flex items-center gap-2 text-[10px] font-bold text-purple-400 hover:text-purple-300 transition-colors bg-purple-500/10 px-3 py-1 rounded-full border border-purple-500/20"
                  >
                    {isUploading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Upload className="w-3 h-3" />}
                    UPLOAD PHOTO
                  </button>
                  <input 
                    type="file" 
                    ref={fileInputRef} 
                    onChange={handleImageUpload} 
                    className="hidden" 
                    accept="image/*"
                  />
                </div>
                
                <div className="bg-slate-800/30 border border-white/5 rounded-3xl p-4">
                  <div className="grid grid-cols-8 gap-2 max-h-[140px] overflow-y-auto custom-scrollbar p-1">
                    {/* Dynamic emoji list */}
                    {[...EMOJI_CATEGORIES.meal, ...EMOJI_CATEGORIES.drink, ...EMOJI_CATEGORIES.snack, ...EMOJI_CATEGORIES.special].map((emoji, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => setNewProduct({...newProduct, image_url: emoji})}
                        className={cn(
                          "w-10 h-10 flex items-center justify-center text-xl rounded-xl transition-all",
                          newProduct.image_url === emoji 
                            ? "bg-purple-600 scale-110 shadow-lg shadow-purple-900/40" 
                            : "bg-white/5 hover:bg-white/10"
                        )}
                      >
                        {emoji}
                      </button>
                    ))}
                  </div>
                </div>
                
                <div className="mt-4 flex items-center gap-4 bg-white/5 p-3 rounded-2xl border border-white/5">
                   <div className="w-14 h-14 rounded-2xl bg-purple-600/20 flex items-center justify-center text-2xl border border-purple-500/30 overflow-hidden shrink-0">
                     {newProduct.image_url.startsWith('http') ? (
                       <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                     ) : (
                       <span>{newProduct.image_url || '❓'}</span>
                     )}
                   </div>
                   <div className="flex-1 min-w-0">
                      <p className="text-[10px] font-bold text-slate-400 uppercase">Selected Content</p>
                      <input 
                        type="text"
                        value={newProduct.image_url}
                        onChange={e => setNewProduct({...newProduct, image_url: e.target.value})}
                        className="w-full bg-transparent border-none p-0 text-white font-medium text-xs focus:outline-none truncate"
                        placeholder="Image URL or Emoji..."
                      />
                   </div>
                   {newProduct.image_url.length > 0 && (
                     <button 
                      type="button" 
                      onClick={() => setNewProduct({...newProduct, image_url: ''})}
                      className="p-2 text-slate-500 hover:text-white transition-colors"
                     >
                        <X className="w-4 h-4" />
                     </button>
                   )}
                </div>
              </div>
            </div>

            <div className="flex gap-4 mt-10">
              <button 
                type="button"
                onClick={() => setIsAdding(false)}
                className="flex-1 h-16 rounded-2xl border border-white/5 text-slate-500 text-[11px] font-black uppercase tracking-widest hover:bg-white/5 transition-all"
              >
                Cancel
              </button>
              <button 
                type="submit"
                className="flex-[2] h-16 rounded-2xl bg-purple-600 text-white text-[11px] font-black uppercase tracking-widest shadow-[0_10px_30px_rgba(139,92,246,0.3)] hover:bg-purple-500 transition-all"
              >
                Confirm Registration
              </button>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};

export default ProductManagementView;
