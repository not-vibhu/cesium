/*global define*/
define([
        './defaultValue',
        './DeveloperError',
        './Cartesian2',
        './Cartesian3',
        './Math',
        './ComponentDatatype',
        './IndexDatatype',
        './PrimitiveType',
        './BoundingSphere',
        './Geometry',
        './GeometryAttribute',
        './GeometryAttributes',
        './VertexFormat'
    ], function(
        defaultValue,
        DeveloperError,
        Cartesian2,
        Cartesian3,
        CesiumMath,
        ComponentDatatype,
        IndexDatatype,
        PrimitiveType,
        BoundingSphere,
        Geometry,
        GeometryAttribute,
        GeometryAttributes,
        VertexFormat) {
    "use strict";

    var radiusScratch = new Cartesian2();
    var normalScratch = new Cartesian3();
    var binormalScratch = new Cartesian3();
    var tangentScratch = new Cartesian3();
    var positionScratch = new Cartesian3();


    /**
     * A description of a cylinder.
     *
     * @alias CylinderGeometry
     * @constructor
     *
     * @param {Number} options.length The length of the cylinder.
     * @param {Number} options.topRadius The radius of the top of the cylinder.
     * @param {Number} options.bottomRadius The radius of the bottom of the cylinder.
     * @param {Number} [options.slices = 100] The number of edges around perimeter of the cylinder.
     * @param {VertexFormat} [options.vertexFormat=VertexFormat.DEFAULT] The vertex attributes to be computed.
     *
     * @exception {DeveloperError} options.length must be greater than 0.
     * @exception {DeveloperError} options.topRadius must be greater than 0.
     * @exception {DeveloperError} options.bottomRadius must be greater than 0.
     * @exception {DeveloperError} bottomRadius and topRadius cannot both equal 0.
     * @exception {DeveloperError} options.slices must be greater that 3.
     *
     * @see CylinderGeometry#createGeometry
     *
     * @example
     * // create cylinder geometry
     * var cylinder = new Cesium.CylinderGeometry({
     *     length: 200000,
     *     topRadius: 80000,
     *     bottomRadius: 200000,
     * });
     * var geometry = CylinderGeometry.createGeometry(cylinder);
     */
    var CylinderGeometry = function(options) {
        options = defaultValue(options, defaultValue.EMPTY_OBJECT);

        var length = options.length;
        var topRadius = options.topRadius;
        var bottomRadius = options.bottomRadius;
        var vertexFormat = defaultValue(options.vertexFormat, VertexFormat.DEFAULT);
        var slices = defaultValue(options.slices, 100);

        if (typeof length === 'undefined' || length <= 0) {
            throw new DeveloperError('options.length must be greater than 0');
        }

        if (typeof topRadius === 'undefined' || topRadius < 0) {
            throw new DeveloperError('options.topRadius must be greater than 0');
        }

        if (typeof bottomRadius === 'undefined' || bottomRadius < 0) {
            throw new DeveloperError('options.bottomRadius must be greater than 0');
        }

        if (bottomRadius === 0 && topRadius === 0) {
            throw new DeveloperError('bottomRadius and topRadius cannot both equal 0');
        }

        if (slices < 3) {
            throw new DeveloperError('options.slices must be greater that 3');
        }


        this._length = length;
        this._topRadius = topRadius;
        this._bottomRadius = bottomRadius;
        this._vertexFormat = vertexFormat;
        this._slices = slices;
        this._workerName = 'createCylinderGeometry';
    };

    /**
     * Computes vertices and indices of a cylinder.
     *
     * @param {CylinderGeometry} cylinderGeometry A description of the cylinder.
     * @returns {Geometry} The computed vertices and indices.
     */
    CylinderGeometry.createGeometry = function(cylinderGeometry) {
        var length = cylinderGeometry._length;
        var topRadius = cylinderGeometry._topRadius;
        var bottomRadius = cylinderGeometry._bottomRadius;
        var vertexFormat = cylinderGeometry._vertexFormat;
        var slices = cylinderGeometry._slices;

        var twoSlices = slices + slices;
        var threeSlices = slices + twoSlices;

        var topZ = length * 0.5;
        var bottomZ = -topZ;

        var numVertices = twoSlices + twoSlices;

        var positions = new Array(twoSlices);
        var bottomCircle = new Array(slices);
        var topCircle = new Array(slices);
        var st = (vertexFormat.st) ? new Float32Array(numVertices * 2) : undefined;
        var normals = (vertexFormat.normal) ? new Float32Array(numVertices * 3) : undefined;
        var tangents = (vertexFormat.tangent) ? new Float32Array(numVertices * 3) : undefined;
        var binormals = (vertexFormat.binormal) ? new Float32Array(numVertices * 3) : undefined;

        var computeNormal = (vertexFormat.normal || vertexFormat.tangent || vertexFormat.binormal);
        var computeTangent = (vertexFormat.tangent || vertexFormat.binormal);
        var i;
        var index = 0;
        var bottomIndex = 0;
        var topIndex = 0;
        var normalIndex = 0;
        var tangentIndex = 0;
        var binormalIndex = 0;

        var normal = normalScratch;
        normal.z = 0;
        var tangent = tangentScratch;
        var binormal = binormalScratch;
        for (i = 0; i < slices; i++) {
            var angle = i / slices * CesiumMath.TWO_PI;
            var x = Math.cos(angle);
            var y = Math.sin(angle);
            var bottomX = x * bottomRadius;
            var bottomY = y * bottomRadius;
            var topX = x * topRadius;
            var topY = y * topRadius;

            bottomCircle[bottomIndex++] = bottomX;
            bottomCircle[bottomIndex++] = bottomY;
            bottomCircle[bottomIndex++] = bottomZ;

            topCircle[topIndex++] = topX;
            topCircle[topIndex++] = topY;
            topCircle[topIndex++] = topZ;

            positions[index++] = bottomX;
            positions[index++] = bottomY;
            positions[index++] = bottomZ;
            positions[index++] = topX;
            positions[index++] = topY;
            positions[index++] = topZ;

            if (computeNormal) {
                normal.x = x;
                normal.y = y;

                if (computeTangent) {
                    tangent = Cartesian3.cross(Cartesian3.UNIT_Z, normal, tangent).normalize(tangent);
                }

                if (vertexFormat.normal) {
                    normals[normalIndex++] = x;
                    normals[normalIndex++] = y;
                    normals[normalIndex++] = 0;
                    normals[normalIndex++] = x;
                    normals[normalIndex++] = y;
                    normals[normalIndex++] = 0;
                }

                if (vertexFormat.tangent) {
                    tangents[tangentIndex++] = tangent.x;
                    tangents[tangentIndex++] = tangent.y;
                    tangents[tangentIndex++] = tangent.z;
                    tangents[tangentIndex++] = tangent.x;
                    tangents[tangentIndex++] = tangent.y;
                    tangents[tangentIndex++] = tangent.z;
                }

                if (vertexFormat.binormal) {
                    binormal = Cartesian3.cross(normal, tangent, binormal).normalize(binormal);
                    binormals[binormalIndex++] = binormal.x;
                    binormals[binormalIndex++] = binormal.y;
                    binormals[binormalIndex++] = binormal.z;
                    binormals[binormalIndex++] = binormal.x;
                    binormals[binormalIndex++] = binormal.y;
                    binormals[binormalIndex++] = binormal.z;
                }
            }
        }

        positions = positions.concat(bottomCircle).concat(topCircle);

        if (computeNormal) {
            for (i = 0; i < slices; i++) {
                if (vertexFormat.normal) {
                    normals[normalIndex++] = 0;
                    normals[normalIndex++] = 0;
                    normals[normalIndex++] = -1;
                }
                if (vertexFormat.tangent) {
                    tangents[tangentIndex++] = 1;
                    tangents[tangentIndex++] = 0;
                    tangents[tangentIndex++] = 0;
                }
                if (vertexFormat.binormal) {
                    binormals[binormalIndex++] = 0;
                    binormals[binormalIndex++] = -1;
                    binormals[binormalIndex++] = 0;
                }
            }

            for (i = 0; i < slices; i++) {
                if (vertexFormat.normal) {
                    normals[normalIndex++] = 0;
                    normals[normalIndex++] = 0;
                    normals[normalIndex++] = 1;
                }
                if (vertexFormat.tangent) {
                    tangents[tangentIndex++] = 1;
                    tangents[tangentIndex++] = 0;
                    tangents[tangentIndex++] = 0;
                }
                if (vertexFormat.binormal) {
                    binormals[binormalIndex++] = 0;
                    binormals[binormalIndex++] = 1;
                    binormals[binormalIndex++] = 0;
                }
            }
        }

        var numIndices = 18 * slices - 24;
        var indices = IndexDatatype.createTypedArray(numVertices, numIndices);
        index = 0;
        var j = 0;
        for (i = 0; i < slices - 1; i++) {
            indices[index++] = j;
            indices[index++] = j + 2;
            indices[index++] = j + 3;

            indices[index++] = j;
            indices[index++] = j + 3;
            indices[index++] = j + 1;

            j += 2;
        }

        indices[index++] = twoSlices - 2;
        indices[index++] = 0;
        indices[index++] = 1;
        indices[index++] = twoSlices - 2;
        indices[index++] = 1;
        indices[index++] = twoSlices - 1;

        for (i = 1; i < slices - 1; i++) {
            indices[index++] = twoSlices + i + 1;
            indices[index++] = twoSlices + i;
            indices[index++] = twoSlices;
        }

        for (i = 1; i < slices - 1; i++) {
            indices[index++] = threeSlices;
            indices[index++] = threeSlices + i;
            indices[index++] = threeSlices + i + 1;
        }

        var textureCoordIndex = 0;
        if (vertexFormat.st) {
            var rad = Math.max(topRadius, bottomRadius);
            for (i = 0; i < numVertices; i++) {
                var position = Cartesian3.fromArray(positions, i * 3, positionScratch);
                st[textureCoordIndex++] = (position.x + rad) / (2.0 * rad);
                st[textureCoordIndex++] = (position.y + rad) / (2.0 * rad);
            }
        }

        var attributes = new GeometryAttributes();
        if (vertexFormat.position) {
            attributes.position = new GeometryAttribute({
                componentDatatype: ComponentDatatype.DOUBLE,
                componentsPerAttribute: 3,
                values: new Float64Array(positions)
            });
        }

        if (vertexFormat.normal) {
            attributes.normal = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : normals
            });
        }

        if (vertexFormat.tangent) {
            attributes.tangent = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : tangents
            });
        }

        if (vertexFormat.binormal) {
            attributes.binormal = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 3,
                values : binormals
            });
        }

        if (vertexFormat.st) {
            attributes.st = new GeometryAttribute({
                componentDatatype : ComponentDatatype.FLOAT,
                componentsPerAttribute : 2,
                values : st
            });
        }

        radiusScratch.x = length * 0.5;
        radiusScratch.y = Math.max(bottomRadius, topRadius);

        var boundingSphere = new BoundingSphere(Cartesian3.ZERO, radiusScratch.magnitude());

        return new Geometry({
            attributes : attributes,
            indices : indices,
            primitiveType : PrimitiveType.TRIANGLES,
            boundingSphere : boundingSphere
        });
    };

    return CylinderGeometry;
});
