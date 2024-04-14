import { join, resolve } from 'path';

import { toCasing } from '@goast/core';

import { ts } from '../../../ast';

import type { TypeScriptAngularServicesGeneratorConfig } from './models';

// See packages/typescript/assets/client/angular for reference
export function getReferenceFactories(options: TypeScriptAngularServicesGeneratorConfig) {
  const utilsDirPath = resolve(options.outputDir, options.utilsDirPath);
  return {
    // request-builder.ts
    requestBuilder: ts.reference.factory('RequestBuilder', join(utilsDirPath, 'request-builder.ts')),

    // api-configuration.ts - generated in angular-services-generator.ts
    apiConfiguration: ts.reference.factory(
      toCasing(`${options.domainName ?? ''}ApiConfiguration`, options.typeNameCasing),
      join(utilsDirPath, 'api-configuration.ts'),
    ),

    // api-base-service.ts - generated in angular-service-generator.ts
    apiBaseService: ts.reference.factory('ApiBaseService', join(utilsDirPath, 'api-base-service.ts')),

    // http-status-code.ts - generated in angular-services-generator.ts
    httpStatusCode: ts.reference.factory('HttpStatusCode', join(utilsDirPath, 'http-status-code.ts')),

    // provide.ts - generated in angular-services-generator.ts
    provide: ts.reference.factory(
      toCasing(`provide_${options.domainName ?? ''}_Api`, options.functionNameCasing),
      join(utilsDirPath, 'provide.ts'),
    ),
  };
}
