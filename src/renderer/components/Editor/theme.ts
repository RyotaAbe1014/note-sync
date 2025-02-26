import { EditorThemeClasses } from "lexical";

export const theme: EditorThemeClasses = {
  heading: {
    h1: "scroll-m-20 mt-12 mb-6 text-4xl font-extrabold tracking-tight lg:text-5xl [&:nth-child(1)]:mt-0",
    h2: "scroll-m-20 border-b mt-8 mb-2 pb-2 text-3xl font-semibold tracking-tight transition-colors first:mt-0",
    h3: "scroll-m-20 my-4 text-2xl font-semibold tracking-tight",
    h4: "scroll-m-20 my-3 text-xl font-semibold tracking-tight",
  },
  paragraph: "leading-7 [&:not(:first-child)]:mt-6",
  quote: "mt-6 border-l-2 pl-6",
  list: {
    ul: "my-6 ml-6 list-disc [&>li]:mt-2",
    ol: "my-6 ml-6 list-decimal [&>li]:mt-2",
  },
  text: {
    code: "relative rounded bg-sage-3 text-green-9 px-[0.3rem] py-[0.2rem] font-mono text-sm font-semibold;",
    underline: "underline",
    bold: "font-bold",
    italic: "italic",
    strikethrough: "line-through",
    highlight: "bg-yellow-200",
  },
};
