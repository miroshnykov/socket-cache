let dbMysql = require('./mysqlAdcenterDb').get()

const checksum = async () => {

    try {
        let result = await dbMysql.query(` 

            SELECT
               MD5(CONCAT(LP.MD5_checksum, AFF.MD5_checksum, PROD.MD5_checksum, SEGMENT.MD5_checksum, CAMPAIGN.MD5_checksum)) AS checksum 
            FROM
               (
                  SELECT
                     MD5(CONCAT( sum(length(id)), sum(length(NAME)), sum(length(prefix)), sum(length(target)), sum(length(status)), sum(length(advertiser_id)), sum(length(product_id)), sum(length(forced_landing_url)), sum(length(extra_params)), sum(length(static_url)) )) as MD5_checksum 
                  FROM
                     landing_pages l 
                  WHERE
                     l.\`status\` = 'active' 
               )
               AS LP,
               (
                  SELECT
                     MD5(CONCAT( sum(length(id)), sum(length(NAME)), sum(LENGTH(l.image_path)), sum(LENGTH(l.is_default)), sum(length(status)), sum(LENGTH(l.program_id)), sum(LENGTH(l.show_link)), sum(LENGTH(l.forward_offer_parameters)), sum(LENGTH(l.advertiser_id)) )) as MD5_checksum 
                  FROM
                     ac_products l 
                  WHERE
                     l.\`status\` = 'active' 
               )
               AS PROD,
               (
                  SELECT
                     MD5(CONCAT( sum(LENGTH(a.id)), sum(LENGTH(a.first_name)), sum(LENGTH(a.last_name)), sum(LENGTH(a.affiliate_type)), sum(LENGTH(a.status)), sum(LENGTH(a.account_mgr_id)), sum(LENGTH(a.employee_id)), sum(LENGTH(a.is_traffic_blocked)), sum(LENGTH(a.is_lock_payment)) )) as MD5_checksum 
                  FROM
                     affiliates a 
                  WHERE
                     IFNULL(a.salesforce_id, 0) <> 0 
                     AND a.status IN 
                     (
                        'active',
                        'suspended' 
                     )
               )
               AS AFF,
               (
                  SELECT
                     MD5(CONCAT( sum(length(vs.id)), sum(length(vs.name)), sum(length(vs.priority)), sum(length(vs.is_default)), sum(length(ft.name)), sum(length(vd.name)), sum(length(vd.id)), sum(length(mt.name)), sum(length(vsd.value)) )) AS MD5_checksum 
                  FROM
                     v_segment AS vs 
                     LEFT JOIN
                        (
                           v_segment_dimension AS vsd,
                           v_dimension AS vd,
                           filter_type AS ft,
                           match_type AS mt 
                        )
                        ON ( vsd.v_segment_id = vs.id 
                        AND vsd.v_dimension_id = vd.id 
                        AND vsd.filter_type_id = ft.id 
                        AND vsd.match_type_id = mt.id ) 
                  WHERE
                     vs.id IN 
                     (
                        SELECT
                           v_segment.id 
                        FROM
                           v_segment 
                           JOIN
                              status 
                              ON status.id = v_segment.status_id 
                        WHERE
                           status.NAME LIKE 'active' 
                     )
               )
               AS SEGMENT,
               (
                  SELECT
                     MD5(CONCAT( sum(length(c.id)) , sum(length(c.name)), sum(LENGTH(c.affiliate_id)))) AS MD5_checksum 
                  FROM
                     campaigns c,
                     affiliates a 
                  WHERE
                     a.id = c.affiliate_id 
                     AND c.status = 'active' 
                     AND a.status in ('active') 
                     AND IFNULL(a.salesforce_id, 0) <> 0 
               )
               AS CAMPAIGN
               
        `)
        await dbMysql.end()

        return result[0].checksum
    } catch (e) {
        console.log(e)
    }
}

module.exports = {
    checksum,
}