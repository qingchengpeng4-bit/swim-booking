import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6">
      <Link className="text-sm font-medium text-gray-500 underline-offset-4 transition hover:text-sky-600 hover:underline" href="/">
        &larr; 返回首页
      </Link>
      <h1 className="mt-3 text-3xl font-bold tracking-tight text-gray-950">{title}</h1>
      <div className="mt-2 h-0.5 w-16 rounded-full bg-gradient-to-r from-sky-400 to-cyan-300" />
      {description ? <p className="mt-3 text-sm leading-6 text-gray-600">{description}</p> : null}
    </header>
  );
}
