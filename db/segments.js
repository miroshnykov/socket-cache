let dbMysql = require('./mysqlAdcenterDb').get()

const segments = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT    vs.id AS segment, 
                      vs.name, 
                      vs.priority, 
                      vs.is_default, 
                      ft.name AS filter, 
                      vd.name AS dimension, 
                      vd.id, 
                      mt.name AS matches, 
                      vsd.value 
            FROM      v_segment AS vs 
            LEFT JOIN ( v_segment_dimension AS vsd, v_dimension AS vd, filter_type AS ft, match_type AS mt )
            ON        ( 
                                vsd.v_segment_id = vs.id 
                      AND       vsd.v_dimension_id = vd.id 
                      AND       vsd.filter_type_id = ft.id 
                      AND       vsd.match_type_id = mt.id ) 
            WHERE     vs.id IN 
                      ( 
                             SELECT v_segment.id 
                             FROM   v_segment 
                             JOIN   status 
                             ON     status.id = v_segment.status_id 
                             WHERE  status.NAME LIKE 'active' ) 
            ORDER BY  vs.priority DESC, 
                      dimension DESC 
            LIMIT 5
        `)
        await dbMysql.end()

        console.log(`\nget all segments count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    segments,
}