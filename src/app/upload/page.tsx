import { Metadata } from "next";
import UploadForm from "./upload-form";

export const metadata: Metadata = {
  title: "Submit Your Ghostty Config",
  description:
    "Share your Ghostty terminal configuration with the community. Upload your config and see a live preview before submitting.",
};

export default function UploadPage() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-2">Submit Your Config</h1>
      <p className="text-muted-foreground mb-8">
        Paste your Ghostty config below to preview it and share with the
        community.
      </p>
      <UploadForm />
    </div>
  );
}
