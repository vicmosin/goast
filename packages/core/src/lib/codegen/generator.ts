import { resolve } from 'path';

import { emptyDir, ensureDir } from 'fs-extra';

import { OpenApiGeneratorConfig, OpenApiGeneratorConfigOverrides, defaultOpenApiGeneratorConfig } from './config.js';
import {
  AnyConfig,
  OpenApiGenerationProvider,
  OpenApiGenerationProviderFn,
  OpenApiGenerationProviderType,
  OpenApiGeneratorInput,
  OpenApiGeneratorOutput,
} from './types.js';
import { OpenApiParser } from '../parser.js';
import { Merge } from '../type.utils.js';
import { OpenApiData } from '../types.js';

type OpenApiGenerationProviders = (
  | {
      kind: 'providerCtor';
      generator: OpenApiGenerationProviderType<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
  | {
      kind: 'provider';
      generator: OpenApiGenerationProvider<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
  | {
      kind: 'providerFn';
      generator: OpenApiGenerationProviderFn<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>;
      config: AnyConfig | undefined;
    }
)[];

class _OpenApiGenerator<TOutput extends OpenApiGeneratorInput> {
  private _providers: OpenApiGenerationProviders;
  private _config: OpenApiGeneratorConfig;
  private _parser: OpenApiParser;

  constructor(config: OpenApiGeneratorConfig, providers: OpenApiGenerationProviders, parser: OpenApiParser) {
    this._providers = providers;
    this._config = config;
    this._parser = parser;
  }

  public use<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    generator:
      | OpenApiGenerationProviderType<PInput, POutput, PConfig>
      | OpenApiGenerationProvider<PInput, POutput, PConfig>,
    config?: Partial<PConfig>
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    if (typeof generator === 'function') {
      this._providers.push({
        kind: 'providerCtor',
        generator,
        config,
      });
    } else {
      this._providers.push({
        kind: 'provider',
        generator,
        config,
      });
    }

    return new _OpenApiGenerator<Merge<[TOutput, POutput]>>(this._config, [...this._providers], this._parser);
  }

  public useFn<PInput extends TOutput, POutput extends OpenApiGeneratorOutput, PConfig extends AnyConfig>(
    generator: OpenApiGenerationProviderFn<PInput, POutput, PConfig>,
    config?: Partial<PConfig>
  ): _OpenApiGenerator<Merge<[TOutput, POutput]>> {
    this._providers.push({
      kind: 'providerFn',
      generator: generator as OpenApiGenerationProviderFn<OpenApiGeneratorInput, OpenApiGeneratorOutput, AnyConfig>,
      config,
    });
    return this as unknown as _OpenApiGenerator<Merge<[TOutput, POutput]>>;
  }

  public async generate<T extends OpenApiData>(data: T): Promise<TOutput> {
    const absOutputPath = resolve(this._config.outputDir);
    if (this._config.clearOutputDir) {
      await emptyDir(absOutputPath);
    } else {
      await ensureDir(absOutputPath);
    }

    let input = {} as TOutput;
    for (const generator of this._providers) {
      const context = {
        data,
        input,
        config: this._config,
        state: new Map(),
      };

      let result: OpenApiGeneratorOutput | undefined;
      if (generator.kind === 'providerCtor') {
        const provider = new generator.generator();
        await provider.init(context, generator.config);
        result = await provider.generate();
      } else if (generator.kind === 'provider') {
        await generator.generator.init(context, generator.config);
        result = await generator.generator.generate();
      } else {
        result = await generator.generator(context, generator.config);
      }

      if (result) {
        input = mergeDeep(input, result);
      }
    }
    return input;
  }

  public async parseAndGenerate(...fileNames: (string | string[])[]): Promise<TOutput> {
    const data = await this._parser.parseApisAndTransform(...fileNames);
    return await this.generate(data);
  }
}

export class OpenApiGenerator extends _OpenApiGenerator<{}> {
  constructor(config?: OpenApiGeneratorConfigOverrides) {
    super({ ...defaultOpenApiGeneratorConfig, ...config }, [], new OpenApiParser());
  }
}

function mergeDeep<T extends Record<string, unknown>, U extends Record<string, unknown>[]>(
  target: T,
  ...sources: U
): T & U[number] {
  if (!sources.length) return target;
  const source = sources.shift();

  for (const key in source) {
    const value = source[key];
    if (value && typeof value === 'object') {
      if (!target[key]) Object.assign(target, { [key]: value });
      else mergeDeep(target[key] as Record<string, unknown>, value as Record<string, unknown>);
    } else if (Array.isArray(value)) {
      if (!target[key]) Object.assign(target, { [key]: value });
      else Object.assign(target, { [key]: [...(target[key] as Iterable<unknown>), ...value] });
    } else {
      Object.assign(target, { [key]: value });
    }
  }

  return mergeDeep(target, ...sources);
}
