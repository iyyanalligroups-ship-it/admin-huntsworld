import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useEffect, useState } from 'react';

const SubscriptionPlanForm = ({ open, onClose, onSubmit, initialData }) => {
    const [form, setForm] = useState({
        name: '',
        category: '',
        durationType: '',
        durationValue: '',
        price: '',
        description: ''
    });

    // Enum values from the Mongoose schema
    const categories = ['points', 'ads', 'ebook', 'wallet', 'service', 'gst'];
    const durationTypes = ['per_day', 'one_time', 'per_point', 'per_month', '3_month', 'per_book', 'develop_only', 'percentage'];

    useEffect(() => {
        if (initialData) {
            setForm({
                name: initialData.name || '',
                category: initialData.category || '',
                durationType: initialData.durationType || '',
                durationValue: initialData.durationValue || '',
                price: initialData.price || '',
                description: initialData.description || ''
            });
        } else {
            setForm({
                name: '',
                category: '',
                durationType: '',
                durationValue: '',
                price: '',
                description: ''
            });
        }
    }, [initialData, open]);

    const handleChange = (name, value) => {
        setForm({ ...form, [name]: value });
    };

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle className="text-[#0c1f4d]">{initialData ? 'Update' : 'Create'} Subscription Plan</DialogTitle>
                </DialogHeader>
                <form
                    onSubmit={(e) => {
                        e.preventDefault();
                        onSubmit({
                            ...form,
                            durationValue: form.durationValue ? Number(form.durationValue) : undefined, // Convert to number or undefined
                            price: Number(form.price) // Convert to number
                        });
                    }}
                    className="space-y-3"
                >
                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="name">Plan Name</Label>
                        <Input
                            id="name"
                            name="name"
                            placeholder="e.g. Gold Plan"
                            value={form.name}
                            onChange={(e) => handleChange('name', e.target.value)}
                            required
                            className="border-2 border-slate-300"
                        />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="category">Category</Label>
                        <Select
                            value={form.category}
                            onValueChange={(value) => handleChange('category', value)}
                            required
                        >
                            <SelectTrigger id="category" className="w-full border-2 border-slate-300">
                                <SelectValue placeholder="e.g. Select Category" />
                            </SelectTrigger>
                            <SelectContent>
                                {categories.map((category) => (
                                    <SelectItem key={category} value={category}>
                                        {category.charAt(0).toUpperCase() + category.slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="durationType">Duration Type</Label>
                        <Select
                            value={form.durationType}
                            onValueChange={(value) => handleChange('durationType', value)}
                            required
                        >
                            <SelectTrigger id="durationType" className="w-full border-2 border-slate-300">
                                <SelectValue placeholder="e.g. Select Duration Type" />
                            </SelectTrigger>
                            <SelectContent>
                                {durationTypes.map((type) => (
                                    <SelectItem key={type} value={type}>
                                        {type.replace('_', ' ').charAt(0).toUpperCase() + type.replace('_', ' ').slice(1)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="durationValue">Duration Value</Label>
                        <Input
                            id="durationValue"
                            name="durationValue"
                            type="number"
                            placeholder="e.g. 30"
                            value={form.durationValue}
                            onChange={(e) => handleChange('durationValue', e.target.value)}
                            className="border-2 border-slate-300"
                        />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="price">Price</Label>
                        <Input
                            id="price"
                            name="price"
                            type="number"
                            placeholder="e.g. 999"
                            value={form.price}
                            onChange={(e) => handleChange('price', e.target.value)}
                            required
                            className="border-2 border-slate-300"
                        />
                    </div>

                    <div className="mb-3">
                        <Label className="mb-3" htmlFor="description">Description</Label>
                        <Input
                            id="description"
                            name="description"
                            placeholder="e.g. Premium benefits for loyal users"
                            value={form.description}
                            onChange={(e) => handleChange('description', e.target.value)}
                            className="border-2 border-slate-300"
                        />
                    </div>

                    <Button type="submit" className="w-full bg-[#0c1f4d] hover:bg-[#0c1f4dcb] cursor-pointer">
                        {initialData ? 'Update' : 'Create'}
                    </Button>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default SubscriptionPlanForm;