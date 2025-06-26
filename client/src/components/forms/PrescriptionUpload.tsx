import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Upload, File, X } from "lucide-react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { apiRequest } from "@/lib/queryClient";
import { useToast } from "@/hooks/use-toast";

const uploadSchema = z.object({
  patientId: z.number().min(1, "Patient is required"),
  doctorId: z.number().default(1),
  diagnosis: z.string().min(1, "Diagnosis is required"),
  treatmentPlan: z.string().min(1, "Treatment plan is required"),
  notes: z.string().optional(),
});

type UploadForm = z.infer<typeof uploadSchema>;

interface PrescriptionUploadProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function PrescriptionUpload({ open, onOpenChange }: PrescriptionUploadProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const { data: patients = [] } = useQuery({
    queryKey: ["/api/patients"],
  });

  const form = useForm<UploadForm>({
    resolver: zodResolver(uploadSchema),
    defaultValues: {
      patientId: 0,
      doctorId: 1,
      diagnosis: "",
      treatmentPlan: "",
      notes: "",
    },
  });

  const createPrescriptionMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiRequest("POST", "/api/prescriptions", data);
      return response.json();
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["/api/prescriptions"] });
      toast({
        title: "Success",
        description: "Prescription uploaded successfully",
      });
      form.reset();
      setSelectedFile(null);
      onOpenChange(false);
    },
    onError: () => {
      toast({
        title: "Error",
        description: "Failed to upload prescription",
        variant: "destructive",
      });
    },
  });

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
      if (!allowedTypes.includes(file.type)) {
        toast({
          title: "Invalid file type",
          description: "Please select a JPEG, PNG, or PDF file",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (10MB limit)
      if (file.size > 10 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select a file smaller than 10MB",
          variant: "destructive",
        });
        return;
      }

      setSelectedFile(file);
    }
  };

  const uploadFile = async (file: File): Promise<string> => {
    const formData = new FormData();
    formData.append('prescription', file);

    const response = await fetch('/api/prescriptions/upload', {
      method: 'POST',
      body: formData,
      credentials: 'include',
    });

    if (!response.ok) {
      throw new Error('File upload failed');
    }

    const result = await response.json();
    return result.url;
  };

  const onSubmit = async (data: UploadForm) => {
    if (!selectedFile) {
      toast({
        title: "No file selected",
        description: "Please select a prescription file to upload",
        variant: "destructive",
      });
      return;
    }

    setIsUploading(true);
    try {
      // Upload file first
      const prescriptionUrl = await uploadFile(selectedFile);

      // Create prescription record
      const prescriptionData = {
        ...data,
        prescriptionUrl,
        medications: [],
      };

      createPrescriptionMutation.mutate(prescriptionData);
    } catch (error) {
      toast({
        title: "Upload failed",
        description: "Failed to upload prescription file",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const removeFile = () => {
    setSelectedFile(null);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle className="text-2xl font-semibold text-ayur-gray-900">Upload Prescription</DialogTitle>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            <FormField
              control={form.control}
              name="patientId"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Patient *</FormLabel>
                  <Select 
                    onValueChange={(value) => field.onChange(parseInt(value))} 
                    defaultValue={field.value ? field.value.toString() : ""}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select a patient" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      {patients.map((patient: any) => (
                        <SelectItem key={patient.id} value={patient.id.toString()}>
                          {patient.fullName} - {patient.patientId}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div>
              <label className="block text-sm font-medium text-ayur-gray-700 mb-2">
                Prescription File *
              </label>
              
              {!selectedFile ? (
                <div className="border-2 border-dashed border-ayur-gray-300 rounded-lg p-6 text-center hover:border-ayur-primary-400 transition-colors">
                  <Upload className="mx-auto h-12 w-12 text-ayur-gray-400 mb-4" />
                  <p className="text-sm text-ayur-gray-600 mb-2">
                    Click to upload or drag and drop
                  </p>
                  <p className="text-xs text-ayur-gray-500 mb-4">
                    PNG, JPG, PDF up to 10MB
                  </p>
                  <input
                    type="file"
                    accept=".jpg,.jpeg,.png,.pdf"
                    onChange={handleFileSelect}
                    className="hidden"
                    id="prescription-upload"
                  />
                  <label
                    htmlFor="prescription-upload"
                    className="cursor-pointer inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-ayur-primary hover:bg-ayur-primary-600"
                  >
                    Select File
                  </label>
                </div>
              ) : (
                <div className="border border-ayur-gray-300 rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center space-x-3">
                    <File className="h-8 w-8 text-ayur-gray-400" />
                    <div>
                      <p className="text-sm font-medium text-ayur-gray-900">{selectedFile.name}</p>
                      <p className="text-xs text-ayur-gray-500">
                        {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                      </p>
                    </div>
                  </div>
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    onClick={removeFile}
                    className="text-red-600 hover:text-red-700"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <FormField
              control={form.control}
              name="diagnosis"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Diagnosis *</FormLabel>
                  <FormControl>
                    <Input placeholder="Enter diagnosis from the prescription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="treatmentPlan"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Treatment Plan *</FormLabel>
                  <FormControl>
                    <Textarea rows={3} placeholder="Summarize the treatment plan from the prescription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="notes"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Additional Notes</FormLabel>
                  <FormControl>
                    <Textarea rows={2} placeholder="Any additional notes about this prescription" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="flex items-center justify-end space-x-4 pt-6 border-t border-ayur-gray-200">
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button 
                type="submit" 
                className="bg-ayur-primary text-white hover:bg-ayur-primary-600"
                disabled={isUploading || createPrescriptionMutation.isPending}
              >
                {isUploading || createPrescriptionMutation.isPending ? "Uploading..." : "Upload Prescription"}
              </Button>
            </div>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
