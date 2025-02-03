import { FilePicker } from "@/components/file-picker";

export default function Home() {
  return (
    <main className="container mx-auto py-10">
      <h1 className="text-4xl font-bold mb-8">File Picker</h1>
      <FilePicker />
    </main>
  );
}
