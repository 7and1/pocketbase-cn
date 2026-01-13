import { useState } from "react";
import {
  FormField,
  FormInput,
  FormTextarea,
  FormSelect,
  FormError,
  validateField,
} from "../ui/Form";
import { Button } from "../ui/Button";
import { ProgressiveImage, ResponsiveImage } from "../ui/ProgressiveImage";
import { VirtualList, VirtualGrid } from "../ui/VirtualList";
import { PocketBaseImage } from "../ui/OptimizedImage";

export function FormExample() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [errors, setErrors] = useState<Record<string, string>>({});

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    const newErrors: Record<string, string> = {};

    const nameError = validateField({
      value: name,
      rules: [
        { validate: (v) => v.length > 0, message: "Name is required" },
        {
          validate: (v) => v.length >= 2,
          message: "Name must be at least 2 characters",
        },
      ],
    });
    if (nameError) newErrors.name = nameError;

    const emailError = validateField({
      value: email,
      rules: [
        { validate: (v) => v.length > 0, message: "Email is required" },
        {
          validate: (v) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v),
          message: "Invalid email format",
        },
      ],
    });
    if (emailError) newErrors.email = emailError;

    setErrors(newErrors);

    if (Object.keys(newErrors).length === 0) {
      console.log("Form valid:", { name, email });
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <FormField label="Name" error={errors.name} required>
        {({ id, hasError, ariaDescribedBy }) => (
          <FormInput
            id={id}
            value={name}
            onChange={(e) => setName(e.target.value)}
            error={hasError}
            aria-describedby={ariaDescribedBy}
            placeholder="Enter your name"
          />
        )}
      </FormField>

      <FormField
        label="Email"
        error={errors.email}
        hint="We'll never share your email"
        required
      >
        {({ id, hasError, ariaDescribedBy }) => (
          <FormInput
            id={id}
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            error={hasError}
            aria-describedby={ariaDescribedBy}
            placeholder="your@email.com"
          />
        )}
      </FormField>

      <Button type="submit">Submit</Button>
    </form>
  );
}

const SAMPLE_ITEMS = Array.from({ length: 1000 }, (_, i) => ({
  id: "item-" + i,
  title: "Item " + (i + 1),
  description: "Description for item " + (i + 1),
}));

export function VirtualListExample() {
  return (
    <VirtualList
      items={SAMPLE_ITEMS}
      keyExtractor={(item) => item.id}
      estimateSize={80}
      className="h-96 rounded-lg border border-neutral-200 dark:border-neutral-800"
      renderItem={(item) => (
        <div className="border-b border-neutral-100 p-4 dark:border-neutral-800">
          <h3 className="font-medium">{item.title}</h3>
          <p className="text-sm text-neutral-600 dark:text-neutral-400">
            {item.description}
          </p>
        </div>
      )}
    />
  );
}

export function VirtualGridExample() {
  return (
    <VirtualGrid
      items={SAMPLE_ITEMS}
      keyExtractor={(item) => item.id}
      estimateSize={200}
      columns={(width) => (width > 768 ? 3 : width > 480 ? 2 : 1)}
      gap={16}
      className="h-96"
      renderItem={(item) => (
        <div className="rounded-lg border border-neutral-200 bg-white p-4 dark:border-neutral-800 dark:bg-neutral-950">
          <div className="mb-2 aspect-video w-full rounded bg-neutral-100 dark:bg-neutral-900" />
          <h3 className="font-medium">{item.title}</h3>
        </div>
      )}
    />
  );
}

export function ProgressiveImageExample() {
  return (
    <div className="space-y-4">
      <ProgressiveImage
        src="/placeholder.jpg"
        alt="Progressive loading example"
        className="h-64 w-full rounded-lg object-cover"
      />

      <ResponsiveImage
        src="/placeholder.jpg"
        alt="Responsive image example"
        aspectRatio="16:9"
        className="w-full rounded-lg object-cover"
      />
    </div>
  );
}

export function PocketBaseImageExample() {
  return (
    <PocketBaseImage
      collection="plugins"
      recordId="RECORD_ID"
      filename="image.jpg"
      alt="PocketBase image"
      width={320}
      height={240}
      thumb="320x240"
      className="rounded-lg"
    />
  );
}
