import {
  type AstNodeOptions,
  type BasicAppendValue,
  basicAppendValueGroup,
  notNullish,
  type Nullable,
  type ParametersWithOverloads,
  type Prettify,
  type SingleOrMultiple,
  type SourceBuilder,
  type StringSuggestions,
} from '@goast/core';

import { isKotlinAppendValue } from '../../file-builder.ts';
import { KtNode } from '../node.ts';
import { type KtAppendValue, writeKtNodes } from '../utils/write-kt-node.ts';

type Injects = never;

type Options<TBuilder extends SourceBuilder, TInjects extends string = never> = AstNodeOptions<
  typeof KtNode<TBuilder, TInjects | Injects>,
  {
    tag: string;
    args?: Nullable<Nullable<BasicAppendValue<TBuilder>>[]>;
    description?: Nullable<BasicAppendValue<TBuilder>>;
  }
>;

export class KtDocTag<TBuilder extends SourceBuilder, TInjects extends string = never> extends KtNode<
  TBuilder,
  TInjects | Injects
> {
  public tag: string;
  public args: BasicAppendValue<TBuilder>[];
  public description: BasicAppendValue<TBuilder> | null;

  constructor(options: Options<TBuilder, TInjects>) {
    super(options);
    this.tag = options.tag;
    this.args = options.args?.filter(notNullish) ?? [];
    this.description = options.description ?? null;
  }

  protected override onWrite(builder: TBuilder): void {
    builder.append('@', this.tag);
    this.args.forEach((a) => builder.append(' ', a));
    if (this.description) builder.append(' ', this.description);
  }
}

type _KtDocTagOpt<TBuilder extends SourceBuilder> = Prettify<Omit<Options<TBuilder>, 'tag'>>;

type _KtDocTagArgsMap<TBuilder extends SourceBuilder> =
  & {
    suppress(options?: _KtDocTagOpt<TBuilder>): never;
  }
  & {
    [K in 'return' | 'constructor' | 'receiver' | 'author' | 'since']: (
      description: BasicAppendValue<TBuilder>,
      options?: _KtDocTagOpt<TBuilder>,
    ) => never;
  }
  & {
    [K in 'param' | 'property']: (
      name: string,
      description: BasicAppendValue<TBuilder>,
      options?: _KtDocTagOpt<TBuilder>,
    ) => never;
  }
  & {
    [K in 'see' | 'sample']: (identifier: string, options?: _KtDocTagOpt<TBuilder>) => never;
  }
  & {
    [K in 'throws' | 'exception']: (
      $class: BasicAppendValue<TBuilder>,
      description: BasicAppendValue<TBuilder>,
      options?: _KtDocTagOpt<TBuilder>,
    ) => never;
  };

const tagsWithDescription = [
  'return',
  'constructor',
  'receiver',
  'author',
  'since',
  'param',
  'property',
  'throws',
  'exception',
];

type _KtDocTagArgs<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder,
> = TTagName extends keyof _KtDocTagArgsMap<TBuilder>
  // deno-lint-ignore no-explicit-any
  ? _KtDocTagArgsMap<TBuilder>[TTagName] extends (...args: any[]) => any
    ? ParametersWithOverloads<_KtDocTagArgsMap<TBuilder>[TTagName]>
  : never
  : [options?: _KtDocTagOpt<TBuilder>];

function createDocTag<
  TTagName extends StringSuggestions<keyof _KtDocTagArgsMap<TBuilder>>,
  TBuilder extends SourceBuilder,
>(tag: TTagName, ...args: _KtDocTagArgs<TTagName, TBuilder>): KtDocTag<TBuilder>;
function createDocTag<TBuilder extends SourceBuilder>(tag: string, ...args: unknown[]): KtDocTag<TBuilder> {
  let opt: _KtDocTagOpt<TBuilder> = {};
  if (args.length > 0) {
    const lastArg = args[args.length - 1];
    if (!isKotlinAppendValue(lastArg) && !!lastArg) {
      opt = args.pop() as _KtDocTagOpt<TBuilder>;
    }
  }

  const params = args as BasicAppendValue<TBuilder>[];
  if (tagsWithDescription.includes(tag)) {
    const description = params.pop();
    if (opt.description && description) {
      opt.description = basicAppendValueGroup<TBuilder>([description, opt.description], '\n');
    } else if (description) {
      opt.description = description;
    }
  }

  return new KtDocTag({ ...opt, tag, args: params });
}

const writeDocTags = <TBuilder extends SourceBuilder>(
  builder: TBuilder,
  nodes: SingleOrMultiple<Nullable<KtAppendValue<TBuilder>>>,
): void => {
  writeKtNodes(builder, nodes, { separator: '\n' });
};

export const ktDocTag: typeof createDocTag & { write: typeof writeDocTags } = Object.assign(createDocTag, {
  write: writeDocTags,
});
