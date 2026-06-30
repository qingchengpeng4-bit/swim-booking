import Link from "next/link";

type PageHeaderProps = {
  title: string;
  description?: string;
};

export function PageHeader({ title, description }: PageHeaderProps) {
  return (
    <header className="mb-5">
      <Link className="text-sm font-medium text-gray-600 underline-offset-4 hover:underline" href="/">
        返回首页
      </Link>
      <h1 className="mt-3 text-2xl font-semibold text-gray-950">{title}</h1>
      {description ? <p className="mt-2 text-sm leading-6 text-gray-600">{description}</p> : null}
    </header>
  );
}
