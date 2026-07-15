"use client";

import * as React from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { toast } from "sonner";
import Image from "next/image";
import { Upload, X, BadgeCheck, Clock } from "lucide-react";
import { companyProfileSchema } from "@/lib/validations/employer";
import {
  updateCompanyProfileAction, uploadCompanyLogoAction, uploadCompanyCoverAction,
  addCompanyGalleryImageAction, removeCompanyGalleryImageAction,
} from "@/app/dashboard/employer/company/actions";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TagInput } from "@/components/ui/tag-input";
import { Badge } from "@/components/ui/badge";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import type { Company } from "@/types/database.types";
import type { z } from "zod";

type FormValues = z.infer<typeof companyProfileSchema>;

const COMPANY_SIZE_OPTIONS = [
  { value: "1-10", label: "1-10 employees" },
  { value: "11-50", label: "11-50 employees" },
  { value: "51-200", label: "51-200 employees" },
  { value: "201-500", label: "201-500 employees" },
  { value: "501-1000", label: "501-1000 employees" },
  { value: "1000+", label: "1000+ employees" },
];

export function CompanyProfileForm({ company }: { company: Company | null }) {
  const router = useRouter();
  const [locations, setLocations] = React.useState<string[]>(company?.locations ?? []);
  const [benefits, setBenefits] = React.useState<string[]>(company?.benefits ?? []);
  const logoInputRef = React.useRef<HTMLInputElement>(null);
  const coverInputRef = React.useRef<HTMLInputElement>(null);
  const galleryInputRef = React.useRef<HTMLInputElement>(null);
  const [isUploading, setIsUploading] = React.useState(false);

  const {
    register,
    handleSubmit,
    watch,
    setValue,
    formState: { errors, isSubmitting },
  } = useForm<FormValues>({
    resolver: zodResolver(companyProfileSchema),
    defaultValues: {
      name: company?.name ?? "",
      tagline: company?.tagline ?? "",
      description: company?.description ?? "",
      industry: company?.industry ?? "",
      company_size: company?.company_size ?? "",
      founded_year: company?.founded_year ?? undefined,
      phone: company?.phone ?? "",
      website_url: company?.website_url ?? "",
      linkedin_url: company?.linkedin_url ?? "",
      facebook_url: company?.facebook_url ?? "",
      twitter_url: company?.twitter_url ?? "",
      culture_description: company?.culture_description ?? "",
      video_url: company?.video_url ?? "",
    },
  });

  async function onSubmit(values: FormValues) {
    const result = await updateCompanyProfileAction({ ...values, locations, benefits });
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Company profile saved");
    router.refresh();
  }

  async function handleFileUpload(
    file: File,
    action: (fd: FormData) => Promise<{ error?: string; success?: true }>,
    fieldName: string
  ) {
    setIsUploading(true);
    const fd = new FormData();
    fd.append(fieldName, file);
    const result = await action(fd);
    setIsUploading(false);
    if (result.error) {
      toast.error(result.error);
      return;
    }
    toast.success("Uploaded");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="flex items-center gap-3 p-4">
          {company?.verification_status === "verified" ? (
            <Badge variant="success" className="gap-1"><BadgeCheck className="h-3.5 w-3.5" /> Verified</Badge>
          ) : (
            <Badge variant="outline" className="gap-1"><Clock className="h-3.5 w-3.5" /> Verification pending</Badge>
          )}
          <p className="text-sm text-muted-foreground">
            Verification is reviewed by JobMo admins. You can build your profile and post jobs in the meantime.
          </p>
        </CardContent>
      </Card>

      <Card>
        <CardHeader><CardTitle>Logo & cover image</CardTitle></CardHeader>
        <CardContent className="grid gap-6 sm:grid-cols-2">
          <div>
            <p className="text-sm font-medium">Logo</p>
            <div className="mt-2 flex items-center gap-3">
              {company?.logo_url ? (
                <Image src={company.logo_url} alt="Logo" width={64} height={64} className="rounded-md border border-border object-cover" />
              ) : (
                <div className="flex h-16 w-16 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                  None
                </div>
              )}
              <input
                ref={logoInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], uploadCompanyLogoAction, "logo")}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => logoInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div>
          </div>

          <div>
            <p className="text-sm font-medium">Cover image</p>
            <div className="mt-2 flex items-center gap-3">
              {company?.cover_image_url ? (
                <Image src={company.cover_image_url} alt="Cover" width={112} height={64} className="rounded-md border border-border object-cover" />
              ) : (
                <div className="flex h-16 w-28 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground">
                  None
                </div>
              )}
              <input
                ref={coverInputRef}
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], uploadCompanyCoverAction, "cover")}
              />
              <Button type="button" variant="outline" size="sm" disabled={isUploading} onClick={() => coverInputRef.current?.click()}>
                <Upload className="h-4 w-4" /> Upload
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader><CardTitle>Company details</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="name">Company name</Label>
              <Input id="name" {...register("name")} />
              {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="tagline">Tagline</Label>
              <Input id="tagline" placeholder="A short one-liner about your company" {...register("tagline")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label htmlFor="description">Description</Label>
              <Textarea id="description" rows={5} {...register("description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="industry">Industry</Label>
              <Input id="industry" {...register("industry")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="company_size">Company size</Label>
              <Select value={watch("company_size") || undefined} onValueChange={(v) => setValue("company_size", v)}>
                <SelectTrigger id="company_size"><SelectValue placeholder="Select…" /></SelectTrigger>
                <SelectContent>
                  {COMPANY_SIZE_OPTIONS.map((opt) => (
                    <SelectItem key={opt.value} value={opt.value}>{opt.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="founded_year">Founded year</Label>
              <Input id="founded_year" type="number" {...register("founded_year")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="phone">Contact phone</Label>
              <Input id="phone" type="tel" placeholder="e.g. 011 234 5678" {...register("phone")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="website_url">Website</Label>
              <Input id="website_url" {...register("website_url")} />
            </div>
            <div className="space-y-1.5 sm:col-span-2">
              <Label>Locations</Label>
              <TagInput value={locations} onChange={setLocations} placeholder="Colombo, Kandy, Remote…" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Social media</CardTitle></CardHeader>
          <CardContent className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="linkedin_url">LinkedIn</Label>
              <Input id="linkedin_url" {...register("linkedin_url")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="facebook_url">Facebook</Label>
              <Input id="facebook_url" {...register("facebook_url")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="twitter_url">Twitter / X</Label>
              <Input id="twitter_url" {...register("twitter_url")} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>Culture & benefits</CardTitle></CardHeader>
          <CardContent className="grid gap-4">
            <div className="space-y-1.5">
              <Label>Benefits</Label>
              <TagInput value={benefits} onChange={setBenefits} placeholder="Health insurance, remote work…" />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="culture_description">Culture</Label>
              <Textarea id="culture_description" rows={4} {...register("culture_description")} />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="video_url">Culture video URL (YouTube, etc.)</Label>
              <Input id="video_url" {...register("video_url")} />
            </div>
          </CardContent>
        </Card>

        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving…" : "Save company profile"}
        </Button>
      </form>

      <Card>
        <CardHeader><CardTitle>Gallery</CardTitle></CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
            {(company?.gallery_urls ?? []).map((url) => (
              <div key={url} className="group relative">
                <Image src={url} alt="Gallery" width={160} height={120} className="h-24 w-full rounded-md border border-border object-cover" />
                <button
                  type="button"
                  onClick={async () => {
                    const res = await removeCompanyGalleryImageAction(url);
                    if (res.error) toast.error(res.error);
                    else router.refresh();
                  }}
                  className="absolute right-1 top-1 rounded-full bg-black/60 p-1 text-white opacity-0 transition-opacity group-hover:opacity-100"
                  aria-label="Remove image"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>
            ))}
            <input
              ref={galleryInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={(e) => e.target.files?.[0] && handleFileUpload(e.target.files[0], addCompanyGalleryImageAction, "image")}
            />
            <button
              type="button"
              disabled={isUploading}
              onClick={() => galleryInputRef.current?.click()}
              className="flex h-24 items-center justify-center rounded-md border border-dashed border-border text-xs text-muted-foreground hover:bg-secondary"
            >
              <Upload className="mr-1.5 h-4 w-4" /> Add photo
            </button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
