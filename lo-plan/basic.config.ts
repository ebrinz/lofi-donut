// basic.config.ts lets you define the schema for your database
// after updating this file, you may need to restart the dev server
// docs: https://docs.basic.tech/info/schema 

export const schema = {
  project_id: 'b10c6131-12c3-445f-a658-a8213ca10579',
  version: 0,
  tables: {
    table_name: {
      type: 'collection',
      fields: {
        field_name: {
          type: 'string',
          indexed: true,
        }
      }
    }
  }
}
