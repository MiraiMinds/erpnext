// ERPNext - web based ERP (http://erpnext.com)
// Copyright (C) 2012 Web Notes Technologies Pvt Ltd
// 
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
// 
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.	See the
// GNU General Public License for more details.
// 
// You should have received a copy of the GNU General Public License
// along with this program.	If not, see <http://www.gnu.org/licenses/>.

wn.provide("erpnext.support");
// TODO commonify this code
erpnext.support.MaintenanceVisit = wn.ui.form.Controller.extend({
	customer: function() {
		var me = this;
		if(this.frm.doc.customer) {
			this.frm.call({
				doc: this.frm.doc,
				method: "set_customer_defaults",
				callback: function(r) {
					if(!r.exc) me.frm.refresh_fields();
				}
			});
			
			// TODO shift this to depends_on
			hide_contact_info(this.frm.doc);			
		}
	}, 
	
	get_items: function() {
		if(cur_frm.doc.sales_order_no) {
			wn.model.map_current_doc({
				method: "selling.doctype.sales_order.sales_order.make_maintenance_visit",
				source_name: cur_frm.doc.quotation_no,
			});
		} else if (cur_frm.doc.customer_issue_no) {
			wn.model.map_current_doc({
				method: "support.doctype.customer_issue.customer_issue.make_maintenance_visit",
				source_name: cur_frm.doc.quotation_no,
			});
		} else if (cur_frm.doc.maintenance_schedule) {
			wn.model.map_current_doc({
				method: "support.doctype.maintenance_schedule.maintenance_schedule\
					.make_maintenance_visit",
				source_name: cur_frm.doc.quotation_no,
			});
		}	
	}
});

$.extend(cur_frm.cscript, new erpnext.support.MaintenanceVisit({frm: cur_frm}));

cur_frm.cscript.onload = function(doc, dt, dn) {
	if(!doc.status) set_multiple(dt,dn,{status:'Draft'});
	if(doc.__islocal) set_multiple(dt,dn,{mntc_date:get_today()});
	hide_contact_info(doc);
}

var hide_contact_info = function(doc) {
	if(doc.customer) $(cur_frm.fields_dict.contact_info_section.row.wrapper).toggle(true);
	else $(cur_frm.fields_dict.contact_info_section.row.wrapper).toggle(false);
	
}

cur_frm.cscript.refresh = function(doc) {
	hide_contact_info(doc);
}

cur_frm.cscript.customer_address = cur_frm.cscript.contact_person = function(doc,dt,dn) {		
	if(doc.customer) get_server_fields('get_customer_address', JSON.stringify({customer: doc.customer, address: doc.customer_address, contact: doc.contact_person}),'', doc, dt, dn, 1);
}

cur_frm.fields_dict['customer_address'].get_query = function(doc, cdt, cdn) {
	return{
    	filters:{'customer': doc.customer}
  	}
}

cur_frm.fields_dict['contact_person'].get_query = function(doc, cdt, cdn) {
  	return{
    	filters:{'customer': doc.customer}
  	}
}

cur_frm.cscript.get_items = function(doc, dt, dn) {
	var callback = function(r,rt) { 
		hide_contact_info(doc);
		cur_frm.refresh();
	}
	get_server_fields('fetch_items','','',doc, dt, dn,1,callback);
}

cur_frm.fields_dict['maintenance_visit_details'].grid.get_field('item_code').get_query = function(doc, cdt, cdn) {
	return{
    	filters:{ 'is_service_item': "Yes"}
  	}
}

cur_frm.cscript.item_code = function(doc, cdt, cdn) {
	var fname = cur_frm.cscript.fname;
	var d = locals[cdt][cdn];
	if (d.item_code) {
		get_server_fields('get_item_details',d.item_code, 'maintenance_visit_details',doc,cdt,cdn,1);
	}
}

cur_frm.fields_dict['sales_order_no'].get_query = function(doc) {
	doc = locals[this.doctype][this.docname];
	var cond = '';
	if(doc.customer) {
		cond = '`tabSales Order`.customer = "'+doc.customer+'" AND';
	}
  	return{
    	query:"support.doctype.maintenance_schedule.maintenance_schedule.get_sales_order_no",
    	filters: {
      		'cond': cond,
      		'company': doc.company
    	}
  	}
}

cur_frm.fields_dict['customer_issue_no'].get_query = function(doc) {
	doc = locals[this.doctype][this.docname];
	var cond = [];
  	var filter = [
        ['Customer Issue', 'company', '=', doc.company],
        ['Customer Issue', 'docstatus', '=', 1],
        ['Customer Issue', 'status', 'in', 'Open, Work In Progress']
  	];
	if(doc.customer) cond = ['Customer Issue', 'customer', '=', doc.customer];
  	filter.push(cond);
  	return {
    	filters:filter
  	}	
}

cur_frm.fields_dict['maintenance_schedule'].get_query = function(doc) {
	doc = locals[this.doctype][this.docname];
  	var cond = [];
  	var filter = [
        	['Maintenance Schedule', 'company', '=', doc.company],
        	['Maintenance Schedule', 'docstatus', '=', 1]
  		];
  	if(doc.customer) cond = ['Maintenance Schedule', 'customer', '=', doc.customer];
  	filter.push(cond);
  	return{
    	filters:filter
    }
}

//get query select Territory
cur_frm.fields_dict['territory'].get_query = function(doc,cdt,cdn) {
  	return{
    	filters:{
      		'is_group': "No"
    	}
  	}
}

cur_frm.fields_dict.customer.get_query = function(doc,cdt,cdn) {
	return{	query:"controllers.queries.customer_query" } }