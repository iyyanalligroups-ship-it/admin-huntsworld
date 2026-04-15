import React, { useEffect, useState } from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { useAddPointMutation, useUpdatePointMutation } from '@/redux/api/PointApi';
import { Label } from '@/components/ui/label';
import { toast } from "react-toastify";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const PointForm = ({ selectedPoint, onClose }) => {
  const [formData, setFormData] = useState({
    point_name: '',
    point_count: '',
    point_amount: '',
    time_duration: '',
    time_unit: 'seconds',
  });

  const [addPoint] = useAddPointMutation();
  const [updatePoint] = useUpdatePointMutation();

  useEffect(() => {
    if (selectedPoint) {
      setFormData({
        point_name: selectedPoint.point_name || '',
        point_count: selectedPoint.point_count || '',
        point_amount: selectedPoint.point_amount || '',
        time_duration: selectedPoint.time_duration || '',
        time_unit: selectedPoint.time_unit || 'seconds',
      });
    }
  }, [selectedPoint]);

  const handleSubmit = async () => {
    try {
      if (selectedPoint) {
        const response = await updatePoint({ id: selectedPoint._id, ...formData }).unwrap();
        if (response.success) {
          toast.success(response.message || "Point Updated Successfully");
        } else {
          toast.error(response.message || "Failed to update point");
        }
      } else {
        const response = await addPoint(formData).unwrap();
        if (response.success) {
          toast.success(response.message || "Point Added Successfully");
        } else {
          toast.error(response.message || "Failed to add point");
        }
      }
      onClose();
    } catch (error) {
      toast.error(error?.data?.message || "Something went wrong");
    }
  };

  return (
    <div className="space-y-4 p-4">
      <h2 className="text-xl font-bold">Add Point Count</h2>

      <div className="space-y-2">
        <Label htmlFor="point_name">Enter the Point Name</Label>
        <Input
          id="point_name"
          placeholder="Point Name"
          name="point_name"
          value={formData.point_name}
          onChange={(e) => setFormData({ ...formData, point_name: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="point_count">Enter the Point Count</Label>
        <Input
          id="point_count"
          type="number"
          placeholder="Point Count"
          name="point_count"
          value={formData.point_count}
          onChange={(e) => setFormData({ ...formData, point_count: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="point_amount">Enter the Point Amount</Label>
        <Input
          id="point_amount"
          type="number"
          placeholder="Point Amount"
          name="point_amount"
          value={formData.point_amount}
          onChange={(e) => setFormData({ ...formData, point_amount: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time_duration">Enter the Time Duration</Label>
        <Input
          id="time_duration"
          type="number"
          placeholder="Time Duration"
          name="time_duration"
          value={formData.time_duration}
          onChange={(e) => setFormData({ ...formData, time_duration: e.target.value })}
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="time_unit">Select Time Unit</Label>
        <Select
          value={formData.time_unit}
          onValueChange={(value) => setFormData({ ...formData, time_unit: value })}
        >
          <SelectTrigger id="time_unit">
            <SelectValue placeholder="Select Time Unit" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="seconds">Seconds</SelectItem>
            <SelectItem value="minutes">Minutes</SelectItem>
            <SelectItem value="hours">Hours</SelectItem>
            <SelectItem value="month">Month</SelectItem>
            <SelectItem value="year">Year</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <Button onClick={handleSubmit} className="w-full">
        {selectedPoint ? "Update Point" : "Add Point"}
      </Button>
    </div>
  );
};

export default PointForm;
