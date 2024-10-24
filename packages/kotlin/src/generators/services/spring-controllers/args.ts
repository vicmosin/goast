import type { ApiEndpoint, ApiSchema, SourceBuilder } from '@goast/core';

import type { kt } from '../../../ast/index.ts';
import type { ApiParameterWithMultipartInfo } from '../../../types.ts';

// #region API Interface
export type GenerateApiInterfaceFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiinterfaceFileContent = { interfaceName: string };

export type GetApiInterface = { interfaceName: string };

export type GetApiInterfaceEndpointMethod = { endpoint: ApiEndpoint };
// #endregion

// #region API Controller
export type GenerateApiControllerFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiControllerFileContent = { controllerName: string };

export type GetApiController = { controllerName: string };
// #endregion

// #region API Delegate Interface
export type GenerateApiDelegateInterfaceFile = {
  dirPath: string;
  packageName: string;
};

export type GetApiDelegateInterfaceFileContent = { delegateInterfaceName: string };

export type GetApiDelegateInterface = { delegateInterfaceName: string };

export type GetApiDelegateInterfaceEndpointMethod = { endpoint: ApiEndpoint };
// #endregion

export type GetParameterType = { endpoint: ApiEndpoint; parameter: ApiParameterWithMultipartInfo };

export type GetResponseType = { endpoint: ApiEndpoint };

export type GetTypeUsage<TBuilder extends SourceBuilder> = {
  schema: ApiSchema | undefined;
  nullable?: boolean;
  fallback?: kt.Type<TBuilder>;
};

export type GetSchemaType = { schema: ApiSchema | undefined };

export type GetControllerRequestMapping = { prefix?: string };

export type GetBasePath = object;

export type GetEndpointPath = { endpoint: ApiEndpoint };

export type GetDirectoryPath = { packageName: string };

export type GetPackageName = object;

export type GetApiInterfaceName = object;

export type GetApiDelegateInterfaceName = object;

export type GetApiControllerName = object;

export type GetAllParameters = { endpoint: ApiEndpoint };
