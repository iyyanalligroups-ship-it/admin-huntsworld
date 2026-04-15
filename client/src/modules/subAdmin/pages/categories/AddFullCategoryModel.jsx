
import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { X, Plus, Trash2, FolderTree, Layers, Loader2 } from "lucide-react";
import showToast from "@/toast/showToast";
import { useCreateCategoryTreeMutation } from "@/redux/api/CategoryApi";
import ImageUploadField from "./ImageUploadField";

const AddFullCategoryModal = ({ open, onClose, onSuccess }) => {
  const [createTree, { isLoading }] = useCreateCategoryTreeMutation();

  const initialFormState = {
    category_name: "",
    category_image_file: null,
    category_image_preview: null,
    subCategories: [],
  };

  const [form, setForm] = useState(initialFormState);

  const IMAGE_SERVER_URL = import.meta.env.VITE_API_IMAGE_URL || "http://localhost:8080/api/v1";

  const resetForm = () => setForm(initialFormState);

  const handleClose = () => {
    resetForm();
    onClose();
  };

  const handleCreationSuccess = () => {
    resetForm();
    onSuccess?.();
  };

  useEffect(() => {
    if (!open) resetForm();
  }, [open]);

  // === ALL YOUR ORIGINAL LOGIC 100% UNCHANGED ===
  const uploadImage = async (file, type, name) => {
    if (!file) return "";

    const formData = new FormData();
    let endpoint = "";
    let fileFieldName = "";
    let nameField = "";

    if (type === "category") {
      endpoint = `${IMAGE_SERVER_URL}/category-images/upload-category`;
      fileFieldName = "category_image";
      nameField = "category_name";
    } else if (type === "sub_category") {
      endpoint = `${IMAGE_SERVER_URL}/subCategory-images/upload-sub-category`;
      fileFieldName = "sub_category_image";
      nameField = "sub_category_name";
    } else if (type === "deep_sub_category") {
      endpoint = `${IMAGE_SERVER_URL}/deepSubCategory-images/upload-deep-sub-category`;
      fileFieldName = "deep_sub_category_image";
      nameField = "deep_sub_category_name";
    } else {
      throw new Error("Invalid upload type");
    }

    formData.append(fileFieldName, file);
    formData.append(nameField, name.trim());

    const token = sessionStorage.getItem("token");

    try {
      const res = await fetch(endpoint, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.message || "Image upload failed");
      if (!data.imageUrl) throw new Error("No image URL returned");
      return data.imageUrl;
    } catch (error) {
      console.error(`Failed to upload ${type} image:`, error);
      throw error;
    }
  };

  const handleSubmit = async () => {
    if (!form.category_name.trim()) {
      showToast("Category name is required", "error");
      return;
    }

    try {
      let mainImageUrl = "";
      if (form.category_image_file) {
        mainImageUrl = await uploadImage(form.category_image_file, "category", form.category_name);
      }

      const treeData = {
        category_name: form.category_name.trim(),
        category_image: mainImageUrl,
        subCategories: [],
      };

      for (const sub of form.subCategories) {
        if (!sub.sub_category_name.trim()) continue;

        let subImageUrl = "";
        if (sub.sub_category_image_file) {
          subImageUrl = await uploadImage(sub.sub_category_image_file, "sub_category", sub.sub_category_name);
        }

        const subObj = {
          sub_category_name: sub.sub_category_name.trim(),
          sub_category_image: subImageUrl,
          superSubCategories: [],
        };

        for (const sup of sub.superSubCategories || []) {
          if (!sup.super_sub_category_name.trim()) continue;

          const superObj = {
            super_sub_category_name: sup.super_sub_category_name.trim(),
            deepSubCategories: [],
          };

          for (const deep of sup.deepSubCategories || []) {
            if (!deep.deep_sub_category_name.trim()) continue;

            let deepImageUrl = "";
            if (deep.deep_sub_category_image_file) {
              deepImageUrl = await uploadImage(deep.deep_sub_category_image_file, "deep_sub_category", deep.deep_sub_category_name);
            }

            superObj.deepSubCategories.push({
              deep_sub_category_name: deep.deep_sub_category_name.trim(),
              deep_sub_category_image: deepImageUrl,
            });
          }

          subObj.superSubCategories.push(superObj);
        }

        treeData.subCategories.push(subObj);
      }

      await createTree(treeData).unwrap();
      showToast("Full category hierarchy created successfully!", "success");
      handleCreationSuccess();
      handleClose();
    } catch (err) {
      console.error("Create hierarchy error:", err);
      const message = err?.data?.message || err.message || "Failed to create category tree";
      showToast(message, "error");
    }
  };

  const addSubCategory = () => {
    setForm({
      ...form,
      subCategories: [
        ...form.subCategories,
        {
          sub_category_name: "",
          sub_category_image_file: null,
          sub_category_image_preview: null,
          superSubCategories: [],
        },
      ],
    });
  };

  const addSuperSub = (subIdx) => {
    const newSubs = [...form.subCategories];
    newSubs[subIdx].superSubCategories.push({
      super_sub_category_name: "",
      deepSubCategories: [],
    });
    setForm({ ...form, subCategories: newSubs });
  };

  const addDeepSub = (subIdx, superIdx) => {
    const newSubs = [...form.subCategories];
    newSubs[subIdx].superSubCategories[superIdx].deepSubCategories.push({
      deep_sub_category_name: "",
      deep_sub_category_image_file: null,
      deep_sub_category_image_preview: null,
    });
    setForm({ ...form, subCategories: newSubs });
  };

  const removeSubCategory = (subIdx) => {
    setForm({
      ...form,
      subCategories: form.subCategories.filter((_, i) => i !== subIdx),
    });
  };

  const removeSuperSub = (subIdx, superIdx) => {
    const newSubs = [...form.subCategories];
    newSubs[subIdx].superSubCategories.splice(superIdx, 1);
    setForm({ ...form, subCategories: newSubs });
  };

  const removeDeepSub = (subIdx, superIdx, deepIdx) => {
    const newSubs = [...form.subCategories];
    newSubs[subIdx].superSubCategories[superIdx].deepSubCategories.splice(deepIdx, 1);
    setForm({ ...form, subCategories: newSubs });
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-6 md:p-12 backdrop-blur-sm transition-all duration-300">
      <Card className="w-full max-w-5xl rounded-[2rem] bg-white shadow-[0_20px_50px_rgba(0,0,0,0.3)] flex flex-col overflow-hidden max-h-full border-0 animate-in fade-in zoom-in duration-300">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between border-b bg-white/80 backdrop-blur-md px-10 py-7 z-20">
          <div className="space-y-1">
            <h2 className="text-2xl font-black text-[#0c1f4d] tracking-tight">Add Full Category Hierarchy</h2>
            <p className="text-xs text-slate-400 font-medium">Build level 1 to level 4 taxonomy in a single session</p>
          </div>
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={handleClose} 
            className="rounded-full hover:bg-slate-100 transition-colors"
          >
            <X className="h-6 w-6 text-slate-500" />
          </Button>
        </div>

        {/* Scrollable Body */}
        <div className="flex-1 overflow-y-auto px-10 py-10">
          <div className="space-y-16 max-w-4xl mx-auto">

            {/* Main Category */}
            <div className="rounded-3xl border border-slate-200 bg-slate-50/50 p-10 shadow-sm relative overflow-hidden group transition-all hover:bg-slate-50">
              <div className="absolute top-0 left-0 w-2 h-full bg-[#0c1f4d]"></div>
              <div className="flex items-center gap-3 mb-8">
                <div className="p-2 bg-[#0c1f4d]/10 rounded-lg">
                  <FolderTree className="h-6 w-6 text-[#0c1f4d]" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">Main Category</h3>
              </div>
 
              <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                <div className="space-y-3">
                  <Label htmlFor="main-category" className="text-sm font-bold text-slate-700">
                    Category Name <span className="text-red-500">*</span>
                  </Label>
                  <Input
                    id="main-category"
                    className="h-12 border-slate-200 focus:ring-[#0c1f4d] focus:border-[#0c1f4d]"
                    placeholder="e.g., Electronics, Fashion"
                    value={form.category_name}
                    onChange={(e) => setForm({ ...form, category_name: e.target.value })}
                  />
                </div>
 
                <ImageUploadField
                  label="Category Image"
                  currentPreview={form.category_image_preview}
                  onImageChange={(file, preview) =>
                    setForm({
                      ...form,
                      category_image_file: file,
                      category_image_preview: preview,
                    })
                  }
                />
              </div>
            </div>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <Separator className="bg-slate-100" />
              </div>
              <div className="relative flex justify-center">
                <span className="bg-white px-4">
                  <div className="w-3 h-3 rounded-full bg-slate-200"></div>
                </span>
              </div>
            </div>

            {/* Sub Categories */}
            <div className="space-y-10">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-indigo-50 rounded-lg">
                    <Layers className="h-6 w-6 text-indigo-600" />
                  </div>
                  <h3 className="text-2xl font-bold text-gray-900">Sub Categories</h3>
                </div>
                <Button 
                  onClick={addSubCategory} 
                  size="lg" 
                  className="bg-[#0c1f4d] hover:bg-[#153171] rounded-xl shadow-lg shadow-[#0c1f4d]/10 transition-all hover:scale-[1.02]"
                >
                  <Plus className="mr-2 h-5 w-5" />
                  Add Sub Category
                </Button>
              </div>

              <div className="space-y-10">
                {form.subCategories.length > 0 ? (
                  form.subCategories.map((sub, subIdx) => (
                    <Card key={subIdx} className="overflow-hidden border-slate-200 shadow-md rounded-[2.5rem] bg-white group hover:border-[#0c1f4d]/30 transition-all">
                      <div className="bg-slate-50/80 px-8 py-4 border-b flex items-center justify-between">
                        <span className="text-xs font-black uppercase tracking-widest text-slate-400">Layer 02 — Sub Category</span>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-full transition-colors"
                          onClick={() => removeSubCategory(subIdx)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                      
                      <CardContent className="p-10">
                        <div className="grid grid-cols-1 gap-10 lg:grid-cols-2">
                          <div className="space-y-3">
                            <Label className="text-sm font-bold text-slate-700">Sub Category Name</Label>
                            <Input
                              className="h-12 border-slate-200"
                              placeholder="e.g., Smartphones, T-Shirts"
                              value={sub.sub_category_name}
                              onChange={(e) => {
                                const newSubs = [...form.subCategories];
                                newSubs[subIdx].sub_category_name = e.target.value;
                                setForm({ ...form, subCategories: newSubs });
                              }}
                            />
                          </div>
 
                          <ImageUploadField
                            label="Sub Category Image (optional)"
                            currentPreview={sub.sub_category_image_preview}
                            onImageChange={(file, preview) => {
                              const newSubs = [...form.subCategories];
                              newSubs[subIdx].sub_category_image_file = file;
                              newSubs[subIdx].sub_category_image_preview = preview;
                              setForm({ ...form, subCategories: newSubs });
                            }}
                          />
                        </div>


                        {/* Level 3: Super Sub Categories */}
                        <div className="mt-12 pt-10 border-t border-slate-100">
                          <div className="flex items-center justify-between mb-8">
                            <div className="flex items-center gap-2">
                              <span className="text-xs font-black uppercase tracking-widest text-[#0c1f4d]">Layer 03</span>
                            </div>
                            <Button 
                              onClick={() => addSuperSub(subIdx)} 
                              variant="outline" 
                              size="sm"
                              className="rounded-lg border-indigo-200 text-indigo-600 hover:bg-indigo-50"
                            >
                              <Plus className="mr-2 h-4 w-4" />
                              Add super-sub
                            </Button>
                          </div>
                          <div className="space-y-8">
                            {sub.superSubCategories.map((sup, supIdx) => (
                              <div key={supIdx} className="rounded-2xl border-l-4 border-l-indigo-500 border border-slate-200 bg-indigo-50/10 p-8 group/sup relative shadow-sm">
                                <div className="mb-6 flex items-center gap-4">
                                  <Input
                                    className="h-11 bg-white border-slate-200"
                                    placeholder="Level 3: e.g., iPhone, Android"
                                    value={sup.super_sub_category_name}
                                    onChange={(e) => {
                                      const newSubs = [...form.subCategories];
                                      newSubs[subIdx].superSubCategories[supIdx].super_sub_category_name = e.target.value;
                                      setForm({ ...form, subCategories: newSubs });
                                    }}
                                  />
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-9 w-9 hover:bg-red-50 hover:text-red-600 rounded-full shrink-0"
                                    onClick={() => removeSuperSub(subIdx, supIdx)}
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
 
                                {/* Level 4: Deep Sub Categories */}
                                <div className="space-y-6">
                                  <div className="flex items-center justify-between">
                                    <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Layer 04</span>
                                    <Button
                                      onClick={() => addDeepSub(subIdx, supIdx)}
                                      variant="ghost"
                                      size="sm"
                                      className="h-8 text-[11px] font-bold text-indigo-600 hover:bg-indigo-100/50"
                                    >
                                      <Plus className="mr-1 h-3 w-3" />
                                      New Deep Sub
                                    </Button>
                                  </div>
 
                                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                    {sup.deepSubCategories.map((deep, deepIdx) => (
                                      <div key={deepIdx} className="rounded-xl border border-dashed border-slate-300 bg-white p-6 shadow-sm group/deep relative animate-in slide-in-from-top-2 duration-300">
                                        <div className="mb-4 flex items-center gap-3">
                                          <Input
                                            className="h-10 text-sm border-slate-100 focus:border-slate-300"
                                            placeholder="Level 4 name..."
                                            value={deep.deep_sub_category_name}
                                            onChange={(e) => {
                                              const newSubs = [...form.subCategories];
                                              newSubs[subIdx].superSubCategories[supIdx].deepSubCategories[deepIdx].deep_sub_category_name = e.target.value;
                                              setForm({ ...form, subCategories: newSubs });
                                            }}
                                          />
                                          <Button
                                            variant="ghost"
                                            size="icon"
                                            className="h-8 w-8 hover:bg-red-50 hover:text-red-600 rounded-full shrink-0"
                                            onClick={() => removeDeepSub(subIdx, supIdx, deepIdx)}
                                          >
                                            <Trash2 className="h-3 w-3" />
                                          </Button>
                                        </div>
 
                                        <ImageUploadField
                                          label="Level 4 Image"
                                          currentPreview={deep.deep_sub_category_image_preview}
                                          onImageChange={(file, preview) => {
                                            const newSubs = [...form.subCategories];
                                            const target = newSubs[subIdx].superSubCategories[supIdx].deepSubCategories[deepIdx];
                                            target.deep_sub_category_image_file = file;
                                            target.deep_sub_category_image_preview = preview;
                                            setForm({ ...form, subCategories: newSubs });
                                          }}
                                        />
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                ) : (

                  <div className="py-20 text-center rounded-[3rem] border-2 border-dashed border-slate-200 bg-slate-50/50">
                    <div className="w-16 h-16 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-4 text-slate-300">
                      <Layers className="w-8 h-8" />
                    </div>
                    <p className="text-slate-500 font-medium">
                      No sub categories added yet.<br/>
                      <span className="text-sm font-normal text-slate-400">Start by adding your first level 2 category.</span>
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="flex-shrink-0 flex justify-end gap-3 px-10 py-7 border-t bg-slate-50/50 backdrop-blur-md z-20">
          <Button 
            variant="outline" 
            onClick={handleClose} 
            disabled={isLoading}
            className="h-12 px-8 rounded-xl border-slate-200 text-slate-600 font-bold hover:bg-slate-100 transition-all"
          >
            Discard Changes
          </Button>
          <Button 
            onClick={handleSubmit} 
            disabled={isLoading} 
            className="h-12 px-8 rounded-xl bg-[#0c1f4d] hover:bg-[#153171] font-black tracking-wide shadow-lg shadow-[#0c1f4d]/20 transition-all hover:scale-[1.02]"
          >
            {isLoading ? (
              <div className="flex items-center gap-2">
                <Loader2 className="h-4 w-4 animate-spin" />
                Processing...
              </div>
            ) : "Establish Hierarchy"}
          </Button>
        </div>
    </Card>
  </div>
);
};

export default AddFullCategoryModal;
