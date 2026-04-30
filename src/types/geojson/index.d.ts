declare module 'geojson' {
  export type Position = number[];

  export interface GeoJsonObject {
    type: string;
    bbox?: number[];
  }

  export interface Geometry extends GeoJsonObject {
    coordinates?: Position | Position[] | Position[][] | Position[][][];
  }

  export interface Point extends Geometry {
    type: 'Point';
    coordinates: Position;
  }

  export interface MultiPoint extends Geometry {
    type: 'MultiPoint';
    coordinates: Position[];
  }

  export interface LineString extends Geometry {
    type: 'LineString';
    coordinates: Position[];
  }

  export interface MultiLineString extends Geometry {
    type: 'MultiLineString';
    coordinates: Position[][];
  }

  export interface Polygon extends Geometry {
    type: 'Polygon';
    coordinates: Position[][];
  }

  export interface MultiPolygon extends Geometry {
    type: 'MultiPolygon';
    coordinates: Position[][][];
  }

  export interface GeometryCollection<G extends Geometry = Geometry> extends GeoJsonObject {
    type: 'GeometryCollection';
    geometries: G[];
  }

  export type GeoJsonProperties = Record<string, unknown> | null;

  export interface Feature<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
  > extends GeoJsonObject {
    type: 'Feature';
    geometry: G;
    properties: P;
    id?: string | number;
  }

  export interface FeatureCollection<
    G extends Geometry | null = Geometry,
    P = GeoJsonProperties,
  > extends GeoJsonObject {
    type: 'FeatureCollection';
    features: Array<Feature<G, P>>;
  }
}
