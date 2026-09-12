import { DefaultNamingStrategy, NamingStrategyInterface } from 'typeorm';

function toSnakeCase(input: string): string {
  return input.replace(/([a-z0-9])([A-Z])/g, '$1_$2').toLowerCase();
}

export class SnakeNamingStrategy
  extends DefaultNamingStrategy
  implements NamingStrategyInterface
{
  columnName(
    propertyName: string,
    customName: string | undefined,
    embeddedPrefixes: string[],
  ): string {
    return customName ?? toSnakeCase([...embeddedPrefixes, propertyName].join('_'));
  }
}
