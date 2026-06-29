import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-6 border-b border-gray-200 pb-4">
      <Link className="text-sm text-blue-600" href="/">
        返回首页
      </Link>
      <h1 className="mt-3 text-2xl font-semibold">{title}</h1>
      {description ? <p className="mt-2 text-sm text-gray-600">{description}</p> : null}
    </header>
  );
}
