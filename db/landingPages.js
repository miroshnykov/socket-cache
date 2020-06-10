let dbMysql = require('./mysqlAdcenterDb').get()

const lp = async () => {

    try {
        let result = await dbMysql.query(` 
            SELECT     vs.id AS segment, 
                       vslp.weight, 
                       vslp.ga_experiment_id, 
                       lp.*, 
                       acp.program_id 
            FROM       v_segment_landing_page AS vslp 
            INNER JOIN ( v_segment AS vs, landing_pages AS lp ) 
            ON         ( 
                                  vslp.v_segment_id = vs.id 
                       AND        vslp.landing_pages_id = lp.id ) 
            INNER JOIN ac_products AS acp 
            ON         acp.id = lp.product_id 
            WHERE      acp.status = 'active' 
            AND        lp.status LIKE 'active' 
            AND        vslp.status_id = 1 
            AND        vs.id IN 
                       ( 
                              SELECT v_segment.id 
                              FROM   v_segment 
                              JOIN   status 
                              ON     status.id = v_segment.status_id 
                              WHERE  status.NAME LIKE 'active' ) 
            ORDER BY   vs.priority DESC limit 5
        `)
        await dbMysql.end()

        console.log(`\nget all segments count: ${result.length}`)
        return result
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    lp,
}