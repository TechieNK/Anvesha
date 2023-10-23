filtersview = Vue.component('filters-view', {
    props: ['websiteText', 'fallbackText', 'classValue', 'classLabel', 'appliedFilters', 'totalValues', 'appliedRanges', 'appliedQuantities'],
    data() {
        return {
            filters: [],
            query: ""
        }
    },
    template: `
    <div v-if="websiteText!=''">
        <header-view
            :class-label="classLabel"
            :applied-filters="appliedFilters"
            :applied-ranges="appliedRanges"
            :applied-quantities="appliedQuantities"
            @remove-filter="removeFilter"
            @remove-range="removeRange"
            @remove-quantity="removeQuantity"
        >
        </header-view>
        <div class="content">
            <img v-if="!filters.length" src='images/loading.gif'>
            <p v-else-if="filters[0].value=='Empty'">No filters available</p>
            <div v-else>
                <p v-if="totalValues>0" v-html="displayPluralCount(websiteText.itemCount||fallbackText.itemCount,totalValues)"></p>
                <p><b>Add a filter:</b></p> 
                <ul>
                    <li v-for="filter in filters">
                        <a @click="showFilter(filter)">{{filter.valueLabel.value}}</a>
                    </li>
                </ul>
            </div>
            <div><a :href="query">{{ websiteText.viewQuery||fallbackText.viewQuery }}</a></div>
        </div>
    </div>`,
    methods: {
        changePage(page) {
            this.$emit('change-page', page)
        },
        displayPluralCount(message,totalValues) {
            if(message){
                matches = message.match('{{PLURAL:[\\s]*\\$1\\|(.*)}}')
                pluralValues = matches[1].split("|")
                pluralMap = {}
                pluralConditions = ['zero=', 'one=', 'two=', 'few=', 'many=']
                pluralCopy = [...pluralValues]
                pluralConditions.forEach((element, index) => {
                    pluralOne = pluralValues.filter((obj)=>{
                        return obj.includes(element)
                    });
                    if(pluralOne.length!==0){
                        pluralMap[index.toString()] = pluralOne[0].replace(element, '')
                        pluralCopy = pluralCopy.filter((obj)=>{
                            return !obj.includes(element)
                        })
                    }
                });
                if(totalValues === 0 && Object.keys(pluralMap).includes('0')){
                    str = pluralMap['0'];
                } else if(totalValues === 1 && Object.keys(pluralMap).includes('1')){
                    str = pluralMap['1'];
                } else if(totalValues === 2 && Object.keys(pluralMap).includes('2')){
                    str = pluralMap['2'];
                } else if((totalValues >2 && totalValues <=6)
                    && Object.keys(pluralMap).includes('3')){
                    str = pluralMap['3'];
                } else if(totalValues >6 && Object.keys(pluralMap).includes('4')){
                    str = pluralMap['4'];
                } else{
                    if(Object.keys(pluralMap).length === 0){
                        str = matches[1].split('|')[(totalValues > 1 ? 1 : 0)]
                    } else if(pluralCopy.length !== 0){
                        str = pluralCopy[0];
                    }
                }
                str = str.replace("$1", "<b>" + (totalValues < 1000000 ? numberWithCommas(totalValues) : '1 million +') + "</b>")
                return message.replace(/{{PLURAL:[\s]*\$1\|(.*)}}/g, str)
            }
        },
        showFilter(filter) {
            this.$emit('update-filter', filter)
        },
        removeFilter(value) {
            this.$emit("remove-filter", value, 'filters');
        },
        removeRange(range) {
            this.$emit("remove-range", range, 'filters');
        },
        removeQuantity(quantity) {
            this.$emit("remove-quantity", quantity, 'filters');
        }
    },
    mounted() {
        var sparqlQuery = "SELECT ?value ?valueLabel ?property WHERE {\n" +
            "  wd:" + this.classValue + " wdt:" + propertiesForThisType + " ?value.\n" +
            "  ?value wikibase:propertyType ?property.\n" +
            "  FILTER (?property in (wikibase:Time, wikibase:Quantity, wikibase:WikibaseItem))  \n" +
            "  SERVICE wikibase:label { bd:serviceParam wikibase:language \"" + lang + "\". }\n" +
            "}\n" +
            "ORDER BY ?valueLabel";
        const fullUrl = sparqlEndpoint + encodeURIComponent(sparqlQuery);
        this.query = 'https://query.wikidata.org/#' + encodeURIComponent(sparqlQuery);
        axios.get(fullUrl)
            .then(response => (response.data['results']['bindings'].length ? this.filters = [...response.data['results']['bindings']] : this.filters.push({ value: "Empty", valueLabel: "No data" })))
            .catch(error => {
                this.items.push({ value: "Error" })
            })
    }
})
